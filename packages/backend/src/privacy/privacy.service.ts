import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrivacyService {
  constructor(private db: PrismaService) {}

  async getPrivacySettings(userId: string) {
    const settings = await this.db.privacySetting.findMany({ where: { userId } });
    if (settings.length === 0) {
      const defaults = {
        phoneVisibility: 'EVERYONE',
        forwardRestriction: 'false',
        autoDeleteTimer: '0',
        lastSeen: 'EVERYONE',
        profilePhoto: 'EVERYONE',
        onlineStatus: 'EVERYONE',
      };
      await this.updatePrivacySettings(userId, defaults);
      return this.db.privacySetting.findMany({ where: { userId } });
    }
    return settings;
  }

  async updatePrivacySettings(userId: string, data: any) {
    const updates = Object.entries(data).map(([field, value]) =>
      this.db.privacySetting.upsert({
        where: { userId_field: { userId, field } },
        update: { value: String(value) },
        create: { userId, field, value: String(value) },
      })
    );
    await this.db.$transaction(updates);
    return this.getPrivacySettings(userId);
  }
}
