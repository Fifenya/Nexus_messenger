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

interface AuthedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN ?? '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

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

      this.broadcastPresence(client.userId!, 'online');
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
      this.broadcastPresence(client.userId, 'offline');
    }
  }

  private broadcastPresence(userId: string, status: 'online' | 'offline') {
    this.server.emit('presence:update', { userId, status });
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
