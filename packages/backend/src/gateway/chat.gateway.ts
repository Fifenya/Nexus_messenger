import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';

export const gatewayServer: { current?: Server } = {};

interface AuthedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    gatewayServer.current = server;
  }

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
    private readonly notifications: NotificationsService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('No token provided');

      const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
      client.userId = payload.sub;

      client.join(`user:${client.userId}`);

      const chats = await this.chatsService.listForUser(client.userId!);
      chats.forEach((chat) => client.join(`chat:${chat.id}`));

      await this.prisma.user.update({
        where: { id: client.userId },
        data: { onlineStatus: 'online' },
      });

      await this.broadcastPresence(client.userId!, 'online');
    } catch (err) {
      this.logger.warn(`Rejected socket connection: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthedSocket) {
    if (!client.userId) return;
    const remaining = await this.server.in(`user:${client.userId}`).fetchSockets();
    if (remaining.length === 0) {
      await this.prisma.user.update({
        where: { id: client.userId },
        data: { onlineStatus: 'offline', lastSeenAt: new Date() },
      });
      await this.broadcastPresence(client.userId, 'offline');
    }
  }

  private async broadcastPresence(userId: string, status: 'online' | 'offline') {
    const rows = await this.prisma.privacySetting.findMany({ where: { userId } });
    const map: any = {};
    rows.forEach(r => { map[r.field] = r.value; });
    const scope = map?.onlineStatus ?? 'EVERYONE';

    if (scope === 'NOBODY') {
      // никто не видит онлайн — шлём только "скрыт"
      this.server.emit('presence:update', { userId, status: 'offline', hidden: true });
      return;
    }

    const payload = {
      userId,
      status,
      lastSeenAt: status === 'offline' ? new Date().toISOString() : null,
    };

    if (scope === 'CONTACTS') {
      // онлайн видят только участники общих чатов
      const chats = await this.prisma.chatMember.findMany({ where: { userId }, select: { chatId: true } });
      for (const c of chats) this.server.to(`chat:${c.chatId}`).emit('presence:update', payload);
      return;
    }

    this.server.emit('presence:update', payload);
  }

  @SubscribeMessage('message:send')
  async onMessageSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    body: { chatId: string; text?: string; replyToId?: string; attachments?: any[] },
  ) {
    if (!client.userId) return;
    const message = await this.messagesService.create(body.chatId, client.userId, {
      text: body.text,
      replyToId: body.replyToId,
      attachments: body.attachments as any,
    });
    this.server.to(`chat:${body.chatId}`).emit('message:new', message);

    // Обновляем метаданные чата и шлём всем участникам — для живого списка
    const chat = await this.chatsService.findOneForUser(body.chatId, client.userId);
    for (const member of chat.members) {
      this.server.to(`user:${member.userId}`).emit('chat:updated', {
        ...chat,
        lastMessage: message,
        updatedAt: new Date(),
      });
    }

    this.pushToOfflineMembers(body.chatId, client.userId, message);
    return message;
  }

  private async pushToOfflineMembers(chatId: string, senderId: string, message: any) {
    try {
      const chat = await this.chatsService.findOneForUser(chatId, senderId);
      const sender = chat.members.find((m: any) => m.userId === senderId)?.user;
      const onlineSocketUserIds = new Set(
        (await this.server.in(`chat:${chatId}`).fetchSockets()).map((s: any) => s.userId),
      );

      for (const member of chat.members) {
        if (member.userId === senderId) continue;
        if (onlineSocketUserIds.has(member.userId)) continue;

        const recipient = await this.prisma.user.findUnique({ where: { id: member.userId } });
        if (!recipient?.pushToken) continue;

        await this.notifications.sendNewMessage(recipient.pushToken, {
          senderName: sender?.displayName ?? sender?.username ?? 'Nexus',
          text: message.text ?? '📎 Вложение',
          chatId,
        });
      }
    } catch (err) {
      this.logger.warn(`Push fan-out failed: ${(err as Error).message}`);
    }
  }

  @SubscribeMessage('message:edit')
  async onMessageEdit(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { chatId: string; messageId: string; text: string },
  ) {
    if (!client.userId) return;
    const message = await this.messagesService.edit(body.messageId, client.userId, { text: body.text });
    this.server.to(`chat:${body.chatId}`).emit('message:updated', message);
    return message;
  }

  @SubscribeMessage('message:delete')
  async onMessageDelete(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { chatId: string; messageId: string },
  ) {
    if (!client.userId) return;
    const message = await this.messagesService.remove(body.messageId, client.userId);
    this.server.to(`chat:${body.chatId}`).emit('message:deleted', { id: message.id, chatId: body.chatId });
    return { ok: true };
  }

  @SubscribeMessage('message:react')
  async onMessageReact(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { messageId: string; emoji: string },
  ) {
    if (!client.userId) return;
    const result = await this.messagesService.react(body.messageId, client.userId, body.emoji);
    this.server.to(`chat:${result.chatId}`).emit('message:reaction', result);
    return result;
  }

  @SubscribeMessage('typing:start')
  onTypingStart(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: { chatId: string }) {
    if (!client.userId) return;
    client.to(`chat:${body.chatId}`).emit('typing:update', {
      chatId: body.chatId,
      userId: client.userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  onTypingStop(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: { chatId: string }) {
    if (!client.userId) return;
    client.to(`chat:${body.chatId}`).emit('typing:update', {
      chatId: body.chatId,
      userId: client.userId,
      isTyping: false,
    });
  }

  @SubscribeMessage('chat:join')
  async onChatJoin(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: { chatId: string }) {
    if (!client.userId) return;
    await this.chatsService.assertMember(body.chatId, client.userId);
    client.join(`chat:${body.chatId}`);
    return { ok: true };
  }
}
