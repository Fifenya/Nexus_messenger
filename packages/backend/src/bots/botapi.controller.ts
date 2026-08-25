import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { gatewayServer } from '../gateway/chat.gateway';

@Controller('botapi')
export class BotApiController {
  constructor(private db: PrismaService) {}

  private async botOrFail(apiId: string) {
    const bot = await this.db.bot.findUnique({ where: { apiId } });
    if (!bot || !bot.userId) throw new NotFoundException('Bot not found');
    return bot;
  }

  @Get(':apiId/me')
  async me(@Param('apiId') apiId: string) {
    const b = await this.botOrFail(apiId);
    return { id: b.apiId, username: b.username, name: b.name, description: b.description };
  }

  @Get(':apiId/chats')
  async chats(@Param('apiId') apiId: string) {
    const b = await this.botOrFail(apiId);
    const rows = await this.db.chatMember.findMany({
      where: { userId: b.userId! },
      include: { chat: { include: { members: { include: { user: { select: { id: true, username: true, displayName: true, isBot: true } } } } } } },
    });
    return rows.map(m => ({
      id: m.chat.id,
      type: m.chat.type,
      title: m.chat.title,
      members: m.chat.members.map(x => ({ id: x.user.id, username: x.user.username, name: x.user.displayName, isBot: x.user.isBot })),
    }));
  }

  @Get(':apiId/updates')
  async updates(@Param('apiId') apiId: string, @Query('since') since?: string) {
    const b = await this.botOrFail(apiId);
    const from = since ? new Date(Number(since)) : new Date(Date.now() - 24 * 3600 * 1000);
    const chatIds = (await this.db.chatMember.findMany({ where: { userId: b.userId! }, select: { chatId: true } })).map(x => x.chatId);
    if (!chatIds.length) return [];
    const msgs = await this.db.message.findMany({
      where: { chatId: { in: chatIds }, senderId: { not: b.userId! }, createdAt: { gt: from } },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: { sender: { select: { id: true, username: true, displayName: true } } },
    });
    return msgs.map(m => ({
      updateId: m.id,
      date: m.createdAt,
      chatId: m.chatId,
      from: { id: m.senderId, username: m.sender?.username, name: m.sender?.displayName },
      text: m.text,
    }));
  }

  @Post(':apiId/send')
  async send(@Param('apiId') apiId: string, @Body() body: { chatId: string; text: string }) {
    const b = await this.botOrFail(apiId);
    if (!body?.chatId || !body?.text?.trim()) throw new BadRequestException('chatId and text required');
    const member = await this.db.chatMember.findUnique({
      where: { userId_chatId: { userId: b.userId!, chatId: body.chatId } },
    });
    if (!member) throw new ForbiddenException('Bot is not a member of this chat');

    const message = await this.db.message.create({
      data: { chatId: body.chatId, senderId: b.userId!, text: body.text.trim() },
    });

    const server: any = gatewayServer.current;
    if (server) {
      server.to(`chat:${body.chatId}`).emit('message:new', message);
      const members = await this.db.chatMember.findMany({ where: { chatId: body.chatId }, select: { userId: true } });
      for (const m of members) {
        server.to(`user:${m.userId}`).emit('chat:updated', { id: body.chatId, lastMessage: message, updatedAt: new Date() });
      }
    }
    return message;
  }
}
