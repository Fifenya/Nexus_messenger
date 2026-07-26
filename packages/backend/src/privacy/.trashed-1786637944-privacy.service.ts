import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';

@Injectable()
export class PrivacyService {
  constructor(private db: DbService) {}

  async getPrivacySettings(userId: string) {
    const settings = await this.db.privacySetting.findMany({
      where: { userId },
    });

    // Если настроек нет, возвращаем дефолтные
    if (settings.length === 0) {
      const defaultSettings = {
        phoneVisibility: 'EVERYONE',
        forwardRestriction: 'false',
        autoDeleteTimer: '0',
        lastSeen: 'EVERYONE',
        profilePhoto: 'EVERYONE',
        onlineStatus: 'EVERYONE',
      };

      await this.updatePrivacySettings(userId, defaultSettings);
      
      return this.db.privacySetting.findMany({
        where: { userId },
      });
    }

    return settings;
  }

  async updatePrivacySettings(userId: string, data: any) {
    const updates = Object.entries(data).map(([field, value]) => {
      return this.db.privacySetting.upsert({
        where: {
          userId_field: {
            userId,
            field,
          },
        },
        update: { value: String(value) },
        create: {
          userId,
          field,
          value: String(value),
        },
      });
    });

    await this.db.$transaction(updates);

    return this.getPrivacySettings(userId);
  }
}