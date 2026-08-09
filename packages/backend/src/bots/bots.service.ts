import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class BotsService {
  constructor(private db: DbService) {}

  async getUserBots(userId: string) {
    return this.db.bot.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBot(userId: string, data: any) {
    const id = uuidv4();
    const token = this.generateToken();

    return this.db.bot.create({
      data: {
        id,
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
    const bot = await this.db.bot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      throw new NotFoundException('Бот не найден');
    }

    if (bot.ownerId !== userId) {
      throw new ForbiddenException('Недостаточно прав');
    }

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
    const bot = await this.db.bot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      throw new NotFoundException('Бот не найден');
    }

    if (bot.ownerId !== userId) {
      throw new ForbiddenException('Недостаточно прав');
    }

    await this.db.bot.delete({
      where: { id: botId },
    });

    return { success: true };
  }

  async regenerateToken(botId: string, userId: string) {
    const bot = await this.db.bot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      throw new NotFoundException('Бот не найден');
    }

    if (bot.ownerId !== userId) {
      throw new ForbiddenException('Недостаточно прав');
    }

    const newToken = this.generateToken();

    return this.db.bot.update({
      where: { id: botId },
      data: { token: newToken },
    });
  }

  private generateToken(): string {
    return `nexus_${uuidv4().replace(/-/g, '')}`;
  }
}