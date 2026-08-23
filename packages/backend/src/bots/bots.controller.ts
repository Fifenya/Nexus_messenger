import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BotsService } from './bots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBotDto, UpdateBotDto } from './dto/bot.dto';

@Controller('bots')
@UseGuards(JwtAuthGuard)
export class BotsController {
  constructor(private botsService: BotsService) {}

  @Get()
  async getMyBots(@Request() req) {
    return this.botsService.getUserBots(req.user.id);
  }

  @Post()
  async createBot(@Request() req, @Body() body: CreateBotDto) {
    return this.botsService.createBot(req.user.id, body);
  }

  @Put(':id')
  async updateBot(
    @Param('id') id: string,
    @Body() body: UpdateBotDto,
    @Request() req,
  ) {
    return this.botsService.updateBot(id, req.user.id, body);
  }

  @Delete(':id')
  async deleteBot(@Param('id') id: string, @Request() req) {
    return this.botsService.deleteBot(id, req.user.id);
  }

  @Post(':id/regenerate-token')
  async regenerateToken(@Param('id') id: string, @Request() req) {
    return this.botsService.regenerateToken(id, req.user.id);
  }
}