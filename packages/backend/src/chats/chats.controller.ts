import { Body, Controller, Get, Param, Post, UseGuards, ForbiddenException, Patch } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CurrentUser } from '../common/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService, private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.chatsService.listForUser(user.id);
  }

  @Get(':id/profile')
  getProfile(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatsService.getChatProfile(id, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatsService.findOneForUser(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateChatDto) {
    return this.chatsService.create(user.id, dto);
  }

  @Post('reorder')
  reorder(@CurrentUser() user: any, @Body() body: any) {
    return this.chatsService.reorder(user.id, body);
  }

  @Post(':id/pin')
  pin(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatsService.pinChat(id, user.id);
  }

  @Post(':id/unpin')
  unpin(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatsService.unpinChat(id, user.id);
  }

  @Patch(':id/avatar')
  async updateAvatar(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { avatarUrl: string }) {
    const member = await this.prisma.chatMember.findFirst({ where: { chatId: id, userId: user.id } });
    if (!member) throw new ForbiddenException('Not a member');
    return this.prisma.chat.update({ where: { id }, data: { avatarUrl: body.avatarUrl } });
  }
}
