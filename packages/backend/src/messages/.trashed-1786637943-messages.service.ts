import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessagesService {
  constructor(private db: DbService) {}

  async getChatMessages(chatId: string, userId: string, limit = 50, offset = 0) {
    // Проверяем, является ли пользователь участником
    const member = await this.db.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Вы не участник этого чата');
    }

    return this.db.message.findMany({
      where: {
        chatId,
        isDeleted: false,
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
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async sendMessage(userId: string, data: any) {
    const message = await this.db.message.create({
      data: {
        id: uuidv4(),
        chatId: data.chatId,
        senderId: userId,
        text: data.text,
        replyToId: data.replyToId,
        deleteTimer: data.deleteTimer,
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
        reactions: true,
        attachments: true,
      },
    });

    return message;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.db.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    // Проверяем права
    const isSender = message.senderId === userId;
    const isAdmin = message.chat.members.some(
      m => m.userId === userId && (m.role === 'ADMIN' || m.role === 'CREATOR'),
    );

    if (!isSender && !isAdmin) {
      throw new ForbiddenException('Недостаточно прав');
    }

    await this.db.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        text: isSender ? 'Сообщение удалено' : 'Сообщение удалено администратором',
      },
    });

    return { success: true };
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = await this.db.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      await this.db.messageReaction.delete({
        where: { id: existing.id },
      });
    } else {
      await this.db.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    // Возвращаем обновленный список реакций
    return this.db.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });
  }
}