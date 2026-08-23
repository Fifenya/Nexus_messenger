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
      orderBy: { updatedAt: 'desc' },
    });
    return chats.map((c) => this.serialize(c, userId));
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
    return this.serialize(chat, userId);
  }

  async assertMember(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { userId_chatId: { userId, chatId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this chat');
    return member;
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
    };
  }
}
