import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { v4 as uuidv4 } from 'uuid';

// Предустановленные темы
export const DEFAULT_THEMES = [
  {
    id: 'default',
    name: 'Nexus Dark',
    isDefault: true,
    variables: {
      '--bg-primary': '#1A1A2E',
      '--bg-secondary': '#252540',
      '--bg-third': '#2A2A4A',
      '--bg-input': '#252540',
      '--text-primary': '#E2E2E2',
      '--text-secondary': '#A0A0C0',
      '--text-muted': '#6A6A8A',
      '--accent': '#5B6ABF',
      '--accent-hover': '#7B8ADF',
      '--accent-light': '#8B9AFF',
      '--border': '#3A3A5A',
      '--message-own': '#5B6ABF',
      '--message-other': '#2A2A4A',
      '--font-family': "'Inter', sans-serif",
    },
    colors: {
      primary: '#5B6ABF',
      background: '#1A1A2E',
      text: '#E2E2E2',
    },
  },
  {
    id: 'light',
    name: 'Nexus Light',
    isDefault: false,
    variables: {
      '--bg-primary': '#F5F5FA',
      '--bg-secondary': '#FFFFFF',
      '--bg-third': '#EAEAEF',
      '--bg-input': '#FFFFFF',
      '--text-primary': '#1A1A2E',
      '--text-secondary': '#5A5A7A',
      '--text-muted': '#8A8AAA',
      '--accent': '#5B6ABF',
      '--accent-hover': '#4A5ABF',
      '--accent-light': '#8B9AFF',
      '--border': '#D0D0E0',
      '--message-own': '#5B6ABF',
      '--message-other': '#EAEAEF',
      '--font-family': "'Inter', sans-serif",
    },
    colors: {
      primary: '#5B6ABF',
      background: '#F5F5FA',
      text: '#1A1A2E',
    },
  },
];

@Injectable()
export class ThemesService {
  constructor(private db: DbService) {}

  async getAllThemes() {
    return this.db.theme.findMany({
      orderBy: [{ isDefault: 'desc' }, { downloads: 'desc' }],
    });
  }

  async getActiveTheme(userId: string) {
    const userTheme = await this.db.userTheme.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        theme: true,
      },
    });

    if (userTheme) {
      return userTheme.theme;
    }

    return this.getDefaultTheme();
  }

  async getDefaultTheme() {
    const theme = await this.db.theme.findFirst({
      where: { isDefault: true },
    });

    if (theme) {
      return theme;
    }

    // Создаем дефолтные темы
    for (const themeData of DEFAULT_THEMES) {
      await this.db.theme.create({
        data: {
          id: themeData.id,
          name: themeData.name,
          isDefault: themeData.isDefault,
          isPublic: true,
          variables: JSON.stringify(themeData.variables),
          colors: JSON.stringify(themeData.colors),
        },
      });
    }

    return this.db.theme.findFirst({
      where: { isDefault: true },
    });
  }

  async createTheme(userId: string, data: any) {
    const id = uuidv4();
    
    return this.db.theme.create({
      data: {
        id,
        name: data.name,
        authorId: userId,
        isPublic: data.isPublic !== false,
        variables: JSON.stringify(data.variables),
        colors: JSON.stringify(data.colors || {}),
        wallpaperUrl: data.wallpaperUrl,
      },
    });
  }

  async activateTheme(userId: string, themeId: string) {
    const theme = await this.db.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundException('Тема не найдена');
    }

    // Деактивируем все темы пользователя
    await this.db.userTheme.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // Активируем выбранную
    await this.db.userTheme.upsert({
      where: {
        userId_themeId: {
          userId,
          themeId,
        },
      },
      update: { isActive: true, appliedAt: new Date() },
      create: {
        userId,
        themeId,
        isActive: true,
      },
    });

    // Увеличиваем счетчик загрузок
    await this.db.theme.update({
      where: { id: themeId },
      data: { downloads: { increment: 1 } },
    });

    return theme;
  }

  async updateTheme(themeId: string, userId: string, data: any) {
    const theme = await this.db.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundException('Тема не найдена');
    }

    if (theme.authorId !== userId && !theme.isDefault) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return this.db.theme.update({
      where: { id: themeId },
      data: {
        name: data.name,
        variables: data.variables ? JSON.stringify(data.variables) : undefined,
        colors: data.colors ? JSON.stringify(data.colors) : undefined,
        wallpaperUrl: data.wallpaperUrl,
        isPublic: data.isPublic,
      },
    });
  }

  async deleteTheme(themeId: string, userId: string) {
    const theme = await this.db.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundException('Тема не найдена');
    }

    if (theme.authorId !== userId && !theme.isDefault) {
      throw new ForbiddenException('Недостаточно прав');
    }

    if (theme.isDefault) {
      throw new ForbiddenException('Нельзя удалить дефолтную тему');
    }

    await this.db.theme.delete({
      where: { id: themeId },
    });

    return { success: true };
  }

  async exportTheme(themeId: string) {
    const theme = await this.db.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundException('Тема не найдена');
    }

    return {
      name: theme.name,
      variables: JSON.parse(theme.variables),
      colors: JSON.parse(theme.colors),
      wallpaperUrl: theme.wallpaperUrl,
    };
  }

  async importTheme(userId: string, data: any) {
    const id = uuidv4();
    
    return this.db.theme.create({
      data: {
        id,
        name: data.name || 'Imported Theme',
        authorId: userId,
        isPublic: false,
        variables: JSON.stringify(data.variables),
        colors: JSON.stringify(data.colors || {}),
        wallpaperUrl: data.wallpaperUrl,
      },
    });
  }
}