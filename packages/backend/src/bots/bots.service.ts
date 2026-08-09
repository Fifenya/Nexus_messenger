import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BotsService {
  constructor(private db: PrismaService) {}

  async getUserBots(userId: string) {
    return this.db.bot.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBot(userId: string, data: any) {
    const token = `nexus_${uuidv4().replace(/-/g, '')}`;
    return this.db.bot.create({
      data: {
        token,
        name: data.name,
        username: data.username,
        description: data.description,
        avatarUrl: data.avatarUrl,
        webhookUrl: data.webhookUrl,
        ownerId: userId,
      },
    });
  }

  async updateBot(botId: string, userId: string, data: any) {
    const bot = await this.db.bot.findUnique({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Бот не найден');
    if (bot.ownerId !== userId) throw new ForbiddenException('Недостаточно прав');
    return this.db.bot.update({
      where: { id: botId },
      data: {
        name: data.name,
        username: data.username,
        description: data.description,
        avatarUrl: data.avatarUrl,
        webhookUrl: data.webhookUrl,
      },
    });
  }

  async deleteBot(botId: string, userId: string) {
    const bot = await this.db.bot.findUnique({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Бот не найден');
    if (bot.ownerId !== userId) throw new ForbiddenException('Недостаточно прав');
    await this.db.bot.delete({ where: { id: botId } });
    return { success: true };
  }

  async regenerateToken(botId: string, userId: string) {
    const bot = await this.db.bot.findUnique({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Бот не найден');
    if (bot.ownerId !== userId) throw new ForbiddenException('Недостаточно прав');
    const newToken = `nexus_${uuidv4().replace(/-/g, '')}`;
    return this.db.bot.update({ where: { id: botId }, data: { token: newToken } });
  }
}
