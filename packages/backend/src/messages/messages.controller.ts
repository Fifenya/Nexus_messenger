import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('chats/:chatId/messages')
  create(@CurrentUser() user: any, @Param('chatId') chatId: string, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(chatId, user.id, dto);
  }

  @Get('chats/:chatId/messages')
  list(
    @CurrentUser() user: any,
    @Param('chatId') chatId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.messagesService.listForChat(chatId, user.id, cursor);
  }

  @Patch('messages/:id')
  edit(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateMessageDto) {
    return this.messagesService.edit(id, user.id, dto);
  }

  @Delete('messages/:id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.messagesService.remove(id, user.id);
  }

  @Post('messages/:id/reactions')
  react(@CurrentUser() user: any, @Param('id') id: string, @Body('emoji') emoji: string) {
    return this.messagesService.react(id, user.id, emoji);
  }
}
