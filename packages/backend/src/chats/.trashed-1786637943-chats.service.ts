import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatsService {
  constructor(private db: DbService) {}

  async getUserChats(userId: string) {
    const memberships = await this.db.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => m.chat);
  }

  async getChatById(chatId: string, userId: string) {
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

    return this.db.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                onlineStatus: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });
  }

  async createChat(userId: string, data: any) {
    const chatId = uuidv4();

    // Если это приватный чат, проверяем, что второй пользователь существует
    if (data.type === 'PRIVATE' && data.userIds) {
      const targetUser = await this.db.user.findUnique({
        where: { id: data.userIds[0] },
      });
      if (!targetUser) {
        throw new BadRequestException('Пользователь не найден');
      }

      // Проверяем, есть ли уже чат между ними
      const existing = await this.db.chatMember.findMany({
        where: {
          userId: { in: [userId, data.userIds[0]] },
        },
        select: { chatId: true },
      });

      const chatIds = existing.map(e => e.chatId);
      const uniqueChatIds = [...new Set(chatIds)];
      
      for (const id of uniqueChatIds) {
        const count = await this.db.chatMember.count({
          where: {
            chatId: id,
            userId: { in: [userId, data.userIds[0]] },
          },
        });
        if (count === 2) {
          const chat = await this.db.chat.findUnique({
            where: { id },
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          });
          return chat;
        }
      }
    }

    // Создаем чат
    const chat = await this.db.chat.create({
      data: {
        id: chatId,
        type: data.type || 'PRIVATE',
        title: data.title,
        avatarUrl: data.avatarUrl,
      },
    });

    // Добавляем участников
    const members = [userId, ...(data.userIds || [])];
    for (const memberId of members) {
      await this.db.chatMember.create({
        data: {
          userId: memberId,
          chatId: chat.id,
          role: memberId === userId ? 'CREATOR' : 'MEMBER',
        },
      });
    }

    return this.getChatById(chat.id, userId);
  }

  async updateChat(chatId: string, userId: string, data: any) {
    // Проверяем права
    const member = await this.db.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!member || (member.role !== 'CREATOR' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return this.db.chat.update({
      where: { id: chatId },
      data: {
        title: data.title,
        avatarUrl: data.avatarUrl,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteChat(chatId: string, userId: string) {
    const member = await this.db.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!member || member.role !== 'CREATOR') {
      throw new ForbiddenException('Только создатель может удалить чат');
    }

    await this.db.chat.delete({
      where: { id: chatId },
    });

    return { success: true };
  }

  async addMembers(chatId: string, userId: string, userIds: string[]) {
    // Проверяем права
    const member = await this.db.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!member || (member.role !== 'CREATOR' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Недостаточно прав');
    }

    for (const newUserId of userIds) {
      await this.db.chatMember.create({
        data: {
          userId: newUserId,
          chatId,
          role: 'MEMBER',
        },
      });
    }

    return this.getChatById(chatId, userId);
  }

  async removeMember(chatId: string, userId: string, targetUserId: string) {
    // Проверяем права
    const member = await this.db.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!member || (member.role !== 'CREATOR' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Недостаточно прав');
    }

    await this.db.chatMember.delete({
      where: {
        userId_chatId: {
          userId: targetUserId,
          chatId,
        },
      },
    });

    return { success: true };
  }

  async leaveChat(chatId: string, userId: string) {
    await this.db.chatMember.delete({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    return { success: true };
  }
}