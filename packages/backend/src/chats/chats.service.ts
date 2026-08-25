import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUserId: string, dto: CreateChatDto) {
    const memberIds = Array.from(new Set([currentUserId, ...dto.memberIds]));

    if (dto.type === 'PRIVATE') {
      if (memberIds.length !== 2) {
        throw new BadRequestException('Private chats must have exactly two members');
      }
      const [a, b] = memberIds;
      const existing = await this.prisma.chat.findFirst({
        where: {
          type: 'PRIVATE',
          AND: [
            { members: { some: { userId: a } } },
            { members: { some: { userId: b } } },
          ],
        },
        include: this.chatInclude(),
      });
      if (existing) return this.serialize(existing, currentUserId);
    }

    if (dto.type === 'GROUP' && memberIds.length < 2) {
      throw new BadRequestException('Group chats need at least two members');
    }

    const chat = await this.prisma.chat.create({
      data: {
        type: dto.type,
        title: dto.type === 'GROUP' ? dto.title ?? 'New group' : null,
        members: {
          create: memberIds.map((userId) => ({
            userId,
            role: userId === currentUserId && dto.type === 'GROUP' ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: this.chatInclude(),
    });

    return this.serialize(chat, currentUserId);
  }

  async listForUser(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: { members: { some: { userId } } },
      include: this.chatInclude(),
    });

    for (const c of chats) await this.maskChatMembers(c, userId);
    const sorted = chats.sort((a, b) => {
      const ma = a.members.find((m: any) => m.userId === userId);
      const mb = b.members.find((m: any) => m.userId === userId);
      if (ma?.pinned && !mb?.pinned) return -1;
      if (!ma?.pinned && mb?.pinned) return 1;
      if (ma?.pinned && mb?.pinned) return (ma.sortOrder || 0) - (mb.sortOrder || 0);
      if ((ma?.sortOrder || 0) !== (mb?.sortOrder || 0)) return (ma?.sortOrder || 0) - (mb?.sortOrder || 0);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return sorted.map((c) => this.serialize(c, userId));
  }

  async findOneForUser(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: this.chatInclude(),
    });
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('You are not a member of this chat');
    }
    await this.maskChatMembers(chat, userId);
    return this.serialize(chat, userId);
  }

  async assertMember(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this chat');
    return member;
  }

  async pinChat(chatId: string, userId: string) {
    await this.assertMember(chatId, userId);
    const top = await this.prisma.chatMember.findFirst({
      where: { userId, pinned: true },
      orderBy: { sortOrder: 'asc' },
    });
    await this.prisma.chatMember.update({
      where: { userId_chatId: { userId, chatId } },
      data: { pinned: true, sortOrder: (top?.sortOrder ?? 0) - 1 },
    });
    return { success: true };
  }

  async unpinChat(chatId: string, userId: string) {
    await this.assertMember(chatId, userId);
    await this.prisma.chatMember.update({
      where: { userId_chatId: { userId, chatId } },
      data: { pinned: false, sortOrder: 0 },
    });
    return { success: true };
  }

  async reorder(userId: string, body: { pinned: string[]; normal: string[] }) {
    const ops: any[] = [];
    (body.pinned || []).forEach((chatId, i) =>
      ops.push(this.prisma.chatMember.update({ where: { userId_chatId: { userId, chatId } }, data: { sortOrder: i } })));
    (body.normal || []).forEach((chatId, i) =>
      ops.push(this.prisma.chatMember.update({ where: { userId_chatId: { userId, chatId } }, data: { sortOrder: i } })));
    if (ops.length) await this.prisma.$transaction(ops);
    return { success: true };
  }

  async getChatProfile(chatId: string, userId: string) {
    await this.assertMember(chatId, userId);
    
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true, onlineStatus: true, lastSeenAt: true } }
          }
        },
        messages: {
          where: { isDeleted: false },
          include: {
            sender: { select: { id: true, username: true, displayName: true } },
            attachments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!chat) throw new NotFoundException('Chat not found');
    
    // Категоризация контента
    const media: any[] = [];
    const videos: any[] = [];
    const voices: any[] = [];
    const files: any[] = [];
    const gifs: any[] = [];
    const music: any[] = [];
    const links: { url: string; message: any }[] = [];
    
    const urlRegex = /https?:\/\/[^\s<]+/g;
    
    for (const msg of chat.messages) {
      // Вложения
      for (const att of msg.attachments) {
        if (att.mimeType?.includes('gif')) {
          gifs.push({ ...att, message: msg });
        } else if (att.mimeType?.startsWith('audio/')) {
          music.push({ ...att, message: msg });
        } else if (att.type === 'image') {
          media.push({ ...att, message: msg });
        } else if (att.type === 'video') {
          videos.push({ ...att, message: msg });
        } else if (att.type === 'voice') {
          voices.push({ ...att, message: msg });
        } else {
          files.push({ ...att, message: msg });
        }
      }
      
      // Ссылки в тексте
      if (msg.text) {
        const urls = msg.text.match(urlRegex);
        if (urls) {
          for (const url of urls) {
            links.push({ url, message: msg });
          }
        }
      }
    }
    
    return {
      id: chat.id,
      type: chat.type,
      title: chat.title,
      avatarUrl: chat.avatarUrl,
      createdAt: chat.createdAt,
      members: chat.members.map(m => ({
        id: m.user.id,
        username: m.user.username,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        onlineStatus: m.user.onlineStatus,
        lastSeenAt: m.user.lastSeenAt,
        role: m.role,
        joinedAt: m.joinedAt
      })),
      media,
      videos,
      voices,
      files,
      gifs,
      music,
      links
    };
  }

  private async privacyMaps(ids: string[]) {
    if (!ids.length) return {};
    const rows = await this.prisma.privacySetting.findMany({ where: { userId: { in: ids } } });
    const maps: Record<string, any> = {};
    rows.forEach(r => { (maps[r.userId] ||= {})[r.field] = r.value; });
    return maps;
  }

  // Участники общего чата = контакты: CONTACTS показываем, скрываем только при NOBODY
  private maskForMember(u: any, map: any) {
    if (!u) return u;
    const out = { ...u };
    const hide = (f: string) => map?.[f] === 'NOBODY';
    if (hide('onlineStatus')) { out.onlineStatus = 'offline'; out.hiddenOnline = true; }
    if (hide('lastSeen')) out.lastSeenAt = null;
    if (hide('profilePhoto')) out.avatarUrl = null;
    if (hide('profile')) { out.bio = ''; out.hiddenProfile = true; }
    return out;
  }

  private async maskChatMembers(chat: any, viewerId: string) {
    const ids = chat.members.map((m: any) => m.userId).filter((id: string) => id !== viewerId);
    const maps = await this.privacyMaps(ids);
    chat.members.forEach((m: any) => { if (m.user) m.user = this.maskForMember(m.user, maps[m.userId]); });
    return chat;
  }

  private chatInclude() {
    return {
      members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, onlineStatus: true, lastSeenAt: true } } } },
      messages: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        include: { sender: { select: { id: true, username: true, displayName: true } } },
      },
    };
  }

  private serialize(chat: any, currentUserId: string) {
    const member = chat.members.find((m: any) => m.userId === currentUserId);
    return {
      id: chat.id,
      type: chat.type,
      title:
        chat.type === 'PRIVATE'
          ? chat.members.find((m: any) => m.userId !== currentUserId)?.user?.displayName ??
            chat.members.find((m: any) => m.userId !== currentUserId)?.user?.username
          : chat.title,
      avatarUrl:
        chat.type === 'PRIVATE'
          ? chat.members.find((m: any) => m.userId !== currentUserId)?.user?.avatarUrl
          : chat.avatarUrl,
      members: chat.members.map((m: any) => ({
        userId: m.userId,
        role: m.role,
        user: m.user,
      })),
      lastMessage: chat.messages?.[0] ?? null,
      updatedAt: chat.updatedAt,
      pinned: member?.pinned || false,
      sortOrder: member?.sortOrder || 0,
    };
  }
}
