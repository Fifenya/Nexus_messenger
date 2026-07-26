import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateChatDto) {
    return this.chatsService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.chatsService.listForUser(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatsService.findOneForUser(id, user.id);
  }
}
