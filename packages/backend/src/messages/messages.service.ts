import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatsService } from '../chats/chats.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

const SENDER_SELECT = { id: true, username: true, displayName: true, avatarUrl: true };

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatsService: ChatsService,
  ) {}

  async create(chatId: string, senderId: string, dto: CreateMessageDto) {
    await this.chatsService.assertMember(chatId, senderId);

    if (!dto.text && (!dto.attachments || dto.attachments.length === 0)) {
      throw new BadRequestException('Message must have text or at least one attachment');
    }

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId,
        text: dto.text,
        replyToId: dto.replyToId,
        attachments: dto.attachments
          ? {
              create: dto.attachments.map((a) => ({
                type: a.type,
                url: a.url,
                size: a.size,
                mimeType: a.mimeType,
                duration: a.duration,
              })),
            }
          : undefined,
      },
      include: { sender: { select: SENDER_SELECT }, reactions: true, attachments: true },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async listForChat(chatId: string, userId: string, cursor?: string, take = 50) {
    await this.chatsService.assertMember(chatId, userId);

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { sender: { select: SENDER_SELECT }, reactions: true, attachments: true },
    });

    return messages.reverse();
  }

  async edit(messageId: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.isDeleted) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('You can only edit your own messages');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { text: dto.text, editedAt: new Date() },
      include: { sender: { select: SENDER_SELECT }, reactions: true },
    });
  }

  async remove(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.isDeleted) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('You can only delete your own messages');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date(), text: null },
    });
  }

  async react(messageId: string, userId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.isDeleted) throw new NotFoundException('Message not found');
    await this.chatsService.assertMember(message.chatId, userId);

    const existing = await this.prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      await this.prisma.messageReaction.delete({ where: { id: existing.id } });
      return { toggled: 'off', emoji, messageId, chatId: message.chatId, userId };
    }

    await this.prisma.messageReaction.create({ data: { messageId, userId, emoji } });
    return { toggled: 'on', emoji, messageId, chatId: message.chatId, userId };
  }
}
