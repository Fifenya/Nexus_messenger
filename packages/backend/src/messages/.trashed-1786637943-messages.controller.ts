import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto, GetMessagesDto } from './dto/message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('chat/:chatId')
  async getMessages(
    @Param('chatId') chatId: string,
    @Query() query: GetMessagesDto,
    @Request() req,
  ) {
    return this.messagesService.getChatMessages(
      chatId,
      req.user.id,
      query.limit,
      query.offset,
    );
  }

  @Post()
  async sendMessage(@Request() req, @Body() body: SendMessageDto) {
    return this.messagesService.sendMessage(req.user.id, body);
  }

  @Delete(':id')
  async deleteMessage(@Param('id') id: string, @Request() req) {
    return this.messagesService.deleteMessage(id, req.user.id);
  }

  @Post(':id/reactions')
  async toggleReaction(
    @Param('id') id: string,
    @Body() body: { emoji: string },
    @Request() req,
  ) {
    return this.messagesService.toggleReaction(id, req.user.id, body.emoji);
  }
}