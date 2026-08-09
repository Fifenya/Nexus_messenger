import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThemesService {
  constructor(private db: PrismaService) {}

  async getAllThemes() {
    return this.db.theme.findMany({
      where: { OR: [{ isPublic: true }, { isDefault: true }] },
      include: { author: { select: { id: true, username: true, displayName: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getMyThemes(userId: string) {
    return this.db.theme.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTheme(userId: string, data: any) {
    return this.db.theme.create({
      data: {
        name: data.name,
        description: data.description,
        colors: data.colors,
        isPublic: data.isPublic || false,
        authorId: userId,
      },
    });
  }

  async deleteTheme(themeId: string, userId: string) {
    const theme = await this.db.theme.findUnique({ where: { id: themeId } });
    if (!theme) throw new NotFoundException('Тема не найдена');
    if (theme.authorId !== userId && !theme.isDefault) throw new ForbiddenException('Недостаточно прав');
    if (theme.isDefault) throw new ForbiddenException('Нельзя удалить дефолтную тему');
    await this.db.theme.delete({ where: { id: themeId } });
    return { success: true };
  }
}
