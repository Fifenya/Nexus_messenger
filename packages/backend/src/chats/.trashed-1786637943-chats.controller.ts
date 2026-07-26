import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateChatDto, UpdateChatDto, AddMembersDto } from './dto/chat.dto';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Get()
  async getMyChats(@Request() req) {
    return this.chatsService.getUserChats(req.user.id);
  }

  @Post()
  async createChat(@Request() req, @Body() body: CreateChatDto) {
    return this.chatsService.createChat(req.user.id, body);
  }

  @Get(':id')
  async getChat(@Param('id') id: string, @Request() req) {
    return this.chatsService.getChatById(id, req.user.id);
  }

  @Put(':id')
  async updateChat(@Param('id') id: string, @Body() body: UpdateChatDto, @Request() req) {
    return this.chatsService.updateChat(id, req.user.id, body);
  }

  @Delete(':id')
  async deleteChat(@Param('id') id: string, @Request() req) {
    return this.chatsService.deleteChat(id, req.user.id);
  }

  @Post(':id/members')
  async addMembers(@Param('id') id: string, @Body() body: AddMembersDto, @Request() req) {
    return this.chatsService.addMembers(id, req.user.id, body.userIds);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.chatsService.removeMember(id, req.user.id, userId);
  }

  @Post(':id/leave')
  async leaveChat(@Param('id') id: string, @Request() req) {
    return this.chatsService.leaveChat(id, req.user.id);
  }
}