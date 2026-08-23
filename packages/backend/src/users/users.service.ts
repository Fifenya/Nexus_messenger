import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  isVerified: true,
  onlineStatus: true,
  lastSeenAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string) {
    if (!query || query.trim().length === 0) return [];
    return this.prisma.user.findMany({
      where: { username: { contains: query } },
      select: PUBLIC_USER_SELECT,
      take: 20,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    id: string,
    data: { displayName?: string; bio?: string; avatarUrl?: string },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: PUBLIC_USER_SELECT,
    });
  }

  async setOnlineStatus(id: string, onlineStatus: 'online' | 'offline') {
    return this.prisma.user.update({
      where: { id },
      data: {
        onlineStatus,
        lastSeenAt: onlineStatus === 'offline' ? new Date() : null,
      },
    });
  }

  async setPushToken(id: string, token: string) {
    await this.prisma.user.update({ where: { id }, data: { pushToken: token } });
    return { ok: true };
  }
}
