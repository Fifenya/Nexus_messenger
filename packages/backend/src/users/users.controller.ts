import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly prisma: PrismaService) {}

  @Get('search')
  async search(@Query('q') q: string, @CurrentUser() user: any) {
    const res = await this.usersService.search(q, user.id);
    return this.mask(res, user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const res = await this.usersService.findById(id);
    return (await this.mask([res], user.id))[0];
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/push-token')
  registerPushToken(@CurrentUser() user: any, @Body('token') token: string) {
    return this.usersService.setPushToken(user.id, token);
  }

  private async mask(users: any[], viewerId: string) {
    if (!users?.length) return users;
    const ids = users.map(u => u.id).filter(id => id !== viewerId);
    const rows = await this.prisma.privacySetting.findMany({ where: { userId: { in: ids } } });
    const maps: any = {};
    rows.forEach(r => { (maps[r.userId] ||= {})[r.field] = r.value; });

    const myChats = await this.prisma.chatMember.findMany({ where: { userId: viewerId }, select: { chatId: true } });
    const myChatIds = myChats.map(c => c.chatId);
    const shared = await this.prisma.chatMember.findMany({
      where: { userId: { in: ids }, chatId: { in: myChatIds } },
      select: { userId: true },
    });
    const contacts = new Set(shared.map(t => t.userId));

    return users.map(u => {
      const m = maps[u.id];
      const isC = contacts.has(u.id);
      const hide = (f: string) => {
        const v = m?.[f] ?? 'EVERYONE';
        return v === 'NOBODY' || (v === 'CONTACTS' && !isC);
      };
      const out = { ...u };
      if (hide('onlineStatus')) { out.onlineStatus = 'offline'; out.hiddenOnline = true; }
      if (hide('lastSeen')) out.lastSeenAt = null;
      if (hide('profilePhoto')) out.avatarUrl = null;
      if (hide('profile')) { out.bio = ''; out.hiddenProfile = true; }
      return out;
    });
  }
  @Get('me/stats')
  stats(@CurrentUser() user: any) {
    return this.usersService.stats(user.id);
  }
}
