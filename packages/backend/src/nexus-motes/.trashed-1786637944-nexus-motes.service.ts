import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NexusMotesService {
  constructor(private db: DbService) {}

  async getAllMotes(query?: { tag?: string; search?: string }) {
    const where: any = {};

    if (query?.tag) {
      where.tags = { contains: query.tag };
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search } },
        { tags: { contains: query.search } },
      ];
    }

    return this.db.nexusMote.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserMotes(userId: string) {
    return this.db.nexusMote.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMote(userId: string, data: any) {
    const id = uuidv4();

    return this.db.nexusMote.create({
      data: {
        id,
        name: data.name,
        url: data.url,
        tags: data.tags || '',
        width: data.width,
        height: data.height,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });
  }

  async deleteMote(moteId: string, userId: string) {
    const mote = await this.db.nexusMote.findUnique({
      where: { id: moteId },
    });

    if (!mote) {
      throw new NotFoundException('Мот не найден');
    }

    if (mote.ownerId !== userId) {
      throw new ForbiddenException('Только владелец может удалить мот');
    }

    await this.db.nexusMote.delete({
      where: { id: moteId },
    });

    return { success: true };
  }
}