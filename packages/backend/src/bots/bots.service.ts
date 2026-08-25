import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BotsService {
  constructor(private db: PrismaService) {}

  async getUserBots(userId: string) {
    return this.db.bot.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'desc' } });
  }

  private async genApiId(): Promise<string> {
    for (;;) {
      const id = 'nb_' + Math.floor(100000000 + Math.random() * 900000000);
      const ex = await this.db.bot.findUnique({ where: { apiId: id } });
      if (!ex) return id;
    }
  }

  async createBot(userId: string, data: any) {
    const username = (data.username || '').trim().toLowerCase();
    if (!/^[a-z0-9_]{3,}bot$/.test(username)) {
      throw new BadRequestException('Username: латиница/цифры/«_» и обязательно заканчивается на "bot"');
    }
    if (!data.name?.trim()) throw new BadRequestException('Укажи имя бота');

    const botUser = await this.db.user.create({
      data: {
        username,
        displayName: data.name.trim(),
        password: 'bot:' + uuidv4(),
        isBot: true,
      },
    }).catch(() => { throw new BadRequestException('Username уже занят'); });

    return this.db.bot.create({
      data: {
        token: 'nexus_' + uuidv4().replace(/-/g, ''),
        apiId: await this.genApiId(),
        userId: botUser.id,
        name: data.name.trim(),
        username,
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
      data: { name: data.name, description: data.description, avatarUrl: data.avatarUrl, webhookUrl: data.webhookUrl },
    });
  }

  async deleteBot(botId: string, userId: string) {
    const bot = await this.db.bot.findUnique({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Бот не найден');
    if (bot.ownerId !== userId) throw new ForbiddenException('Недостаточно прав');
    await this.db.bot.delete({ where: { id: botId } });
    if (bot.userId) await this.db.user.delete({ where: { id: bot.userId } }).catch(() => {});
    return { success: true };
  }

  async regenerateToken(botId: string, userId: string) {
    const bot = await this.db.bot.findUnique({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Бот не найден');
    if (bot.ownerId !== userId) throw new ForbiddenException('Недостаточно прав');
    return this.db.bot.update({ where: { id: botId }, data: { apiId: await this.genApiId() } });
  }
}
