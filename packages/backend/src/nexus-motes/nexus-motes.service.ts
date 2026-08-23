import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NexusMotesService {
  constructor(private db: PrismaService) {}

  async getOrCreateMotesChat(userId: string) {
    const membership = await this.db.chatMember.findFirst({
      where: { userId, chat: { type: 'MOTES' } },
      include: { chat: true },
    });
    if (membership) return membership.chat;

    const chat = await this.db.chat.create({
      data: { type: 'MOTES', title: 'Моты' },
    });
    await this.db.chatMember.create({
      data: { chatId: chat.id, userId, role: 'OWNER' },
    });
    return chat;
  }

  async getGallery(userId: string, query?: { tag?: string; search?: string }) {
    const where: any = { ownerId: userId };
    if (query?.tag) where.tags = { contains: query.tag };
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { tags: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.db.nexusMote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMote(userId: string, data: any) {
    return this.db.nexusMote.create({
      data: {
        name: data.name,
        url: data.url,
        tags: data.tags || '',
        width: data.width,
        height: data.height,
        ownerId: userId,
      },
    });
  }

  async deleteMote(moteId: string, userId: string) {
    const mote = await this.db.nexusMote.findUnique({ where: { id: moteId } });
    if (!mote) throw new NotFoundException('Мот не найден');
    if (mote.ownerId !== userId) throw new ForbiddenException('Только владелец может удалить мот');
    await this.db.nexusMote.delete({ where: { id: moteId } });
    return { success: true };
  }
}
