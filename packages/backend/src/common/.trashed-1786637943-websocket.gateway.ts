import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { DbService } from './db.service';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
  transports: ['websocket'],
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private socketToUser = new Map<string, string>(); // socketId -> userId

  constructor(
    private db: DbService,
    private jwt: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        this.logger.warn('❌ Нет токена');
        return;
      }

      const payload = this.jwt.verify(token);
      client.userId = payload.sub;

      this.connectedUsers.set(client.userId, client.id);
      this.socketToUser.set(client.id, client.userId);

      // Обновляем статус
      await this.db.user.update({
        where: { id: client.userId },
        data: { onlineStatus: 'online', lastSeen: new Date() },
      });

      this.logger.log(`✅ Пользователь ${client.userId} подключен`);
      this.broadcastStatus(client.userId, 'online');
    } catch (error) {
      this.logger.error('❌ Ошибка подключения:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId || this.socketToUser.get(client.id);
    if (userId) {
      this.connectedUsers.delete(userId);
      this.socketToUser.delete(client.id);

      await this.db.user.update({
        where: { id: userId },
        data: { onlineStatus: 'offline', lastSeen: new Date() },
      });

      this.logger.log(`❌ Пользователь ${userId} отключен`);
      this.broadcastStatus(userId, 'offline');
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ) {
    const userId = client.userId || this.socketToUser.get(client.id);
    if (!userId) return;

    try {
      // Сохраняем сообщение
      const message = await this.db.message.create({
        data: {
          chatId: data.chatId,
          senderId: userId,
          text: data.text,
          replyToId: data.replyToId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Получаем всех участников чата
      const members = await this.db.chatMember.findMany({
        where: { chatId: data.chatId },
        select: { userId: true },
      });

      // Отправляем всем участникам
      for (const member of members) {
        const socketId = this.connectedUsers.get(member.userId);
        if (socketId) {
          this.server.to(socketId).emit('new_message', message);
        }
      }
    } catch (error) {
      this.logger.error('Ошибка отправки сообщения:', error);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const userId = client.userId || this.socketToUser.get(client.id);
    if (!userId) return;

    this.broadcastToChat(data.chatId, 'typing', {
      userId,
      chatId: data.chatId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('read')
  async handleRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; messageId: string },
  ) {
    const userId = client.userId || this.socketToUser.get(client.id);
    if (!userId) return;

    // Отмечаем сообщение как прочитанное
    // Здесь логика прочтения

    this.broadcastToChat(data.chatId, 'read_receipt', {
      userId,
      messageId: data.messageId,
    });
  }

  @SubscribeMessage('reaction')
  async handleReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    const userId = client.userId || this.socketToUser.get(client.id);
    if (!userId) return;

    try {
      // Проверяем, есть ли уже такая реакция
      const existing = await this.db.messageReaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId: data.messageId,
            userId,
            emoji: data.emoji,
          },
        },
      });

      if (existing) {
        // Удаляем реакцию
        await this.db.messageReaction.delete({
          where: { id: existing.id },
        });
      } else {
        // Создаем реакцию
        await this.db.messageReaction.create({
          data: {
            messageId: data.messageId,
            userId,
            emoji: data.emoji,
          },
        });
      }

      // Получаем обновленный список реакций
      const reactions = await this.db.messageReaction.findMany({
        where: { messageId: data.messageId },
      });

      // Отправляем обновление всем
      this.broadcastToMessage(data.messageId, 'reaction_updated', {
        messageId: data.messageId,
        reactions,
      });
    } catch (error) {
      this.logger.error('Ошибка реакции:', error);
    }
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; forEveryone: boolean },
  ) {
    const userId = client.userId || this.socketToUser.get(client.id);
    if (!userId) return;

    try {
      const message = await this.db.message.findUnique({
        where: { id: data.messageId },
        include: { chat: true },
      });

      if (!message) return;

      // Проверяем права (создатель или админ)
      const member = await this.db.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId,
            chatId: message.chatId,
          },
        },
      });

      if (message.senderId === userId || member?.role === 'ADMIN' || data.forEveryone) {
        await this.db.message.update({
          where: { id: data.messageId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            text: data.forEveryone ? 'Сообщение удалено' : undefined,
          },
        });

        this.broadcastToChat(message.chatId, 'message_deleted', {
          messageId: data.messageId,
          forEveryone: data.forEveryone,
        });
      }
    } catch (error) {
      this.logger.error('Ошибка удаления:', error);
    }
  }

  private broadcastStatus(userId: string, status: string) {
    this.server.emit('user_status', { userId, status });
  }

  private broadcastToChat(chatId: string, event: string, data: any) {
    this.server.to(`chat:${chatId}`).emit(event, data);
  }

  private broadcastToMessage(messageId: string, event: string, data: any) {
    this.server.to(`message:${messageId}`).emit(event, data);
  }
}