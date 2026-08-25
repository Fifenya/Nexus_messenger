import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  onlineStatus: true,
  lastSeenAt: true,
  bio: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, viewerId?: string) {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();

    // Ищем всех, у кого username или displayName содержит запрос
    const candidates = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
      },
      select: PUBLIC_USER_SELECT,
      take: 50,
    });

    if (!viewerId) return candidates;

    // Получаем настройки приватности для всех найденных
    const ids = candidates.map(u => u.id).filter(id => id !== viewerId);
    if (!ids.length) return candidates.filter(u => u.id === viewerId);

    const privacyRows = await this.prisma.privacySetting.findMany({
      where: { userId: { in: ids }, field: 'searchVisibility' },
    });
    const privMap: Record<string, string> = {};
    privacyRows.forEach(r => { privMap[r.userId] = r.value; });

    // Фильтруем по уровню видимости
    return candidates.filter(u => {
      if (u.id === viewerId) return true; // себя всегда показываем
      const level = privMap[u.id] || 'NAME';
      const uname = u.username.toLowerCase();
      const dname = (u.displayName || '').toLowerCase();

      switch (level) {
        case 'EXACT':
          return uname === q;
        case 'STARTS_WITH':
          return uname.startsWith(q);
        case 'CONTAINS':
          return uname.includes(q);
        case 'NAME':
        default:
          return uname.includes(q) || dname.includes(q);
      }
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT });
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.user.update({ where: { id: userId }, data, select: PUBLIC_USER_SELECT });
  }

  async setPushToken(userId: string, token: string | null) {
    return this.prisma.user.update({ where: { id: userId }, data: { pushToken: token } });
  }

  async stats(userId: string) {
    const [sent, received, reactionsGiven, reactionsReceived, chatsCount, attachments, user] = await Promise.all([
      this.prisma.message.count({ where: { senderId: userId } }),
      this.prisma.message.count({ where: { senderId: { not: userId }, chat: { members: { some: { userId } } } } }),
      this.prisma.messageReaction.count({ where: { userId } }),
      this.prisma.messageReaction.count({ where: { message: { senderId: userId }, userId: { not: userId } } }),
      this.prisma.chatMember.count({ where: { userId } }),
      this.prisma.messageAttachment.count({ where: { message: { senderId: userId } } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    ]);

    const top = await this.prisma.message.groupBy({
      by: ['chatId'],
      where: { senderId: userId },
      _count: { chatId: true },
      orderBy: { _count: { chatId: 'desc' } },
      take: 3,
    });
    const chatIds = top.map(t => t.chatId);
    const chats = await this.prisma.chat.findMany({
      where: { id: { in: chatIds } },
      include: { members: { include: { user: { select: { id: true, displayName: true, username: true, avatarUrl: true } } } } },
    });
    const topChats = top.map(t => {
      const c = chats.find(ch => ch.id === t.chatId);
      let title = (c as any)?.name || 'Группа';
      if (c?.type === 'PRIVATE') {
        const other = c.members.find(m => m.userId !== userId)?.user;
        title = other?.displayName || other?.username || 'Личный чат';
      }
      return { id: t.chatId, title, count: t._count.chatId, type: c?.type };
    });

    return { sent, received, reactionsGiven, reactionsReceived, chatsCount, attachments, since: user?.createdAt, topChats };
  }
}
