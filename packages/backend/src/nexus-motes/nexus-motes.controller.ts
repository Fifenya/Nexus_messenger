import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NexusMotesService } from './nexus-motes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('motes')
@UseGuards(JwtAuthGuard)
export class NexusMotesController {
  constructor(private motesService: NexusMotesService) {}

  @Get('chat')
  async getMotesChat(@Request() req) {
    return this.motesService.getOrCreateMotesChat(req.user.id);
  }

  @Get('gallery')
  async getGallery(@Request() req, @Query() query: { tag?: string; search?: string }) {
    return this.motesService.getGallery(req.user.id, query);
  }

  @Post('gallery')
  async createMote(@Request() req, @Body() body: any) {
    return this.motesService.createMote(req.user.id, body);
  }

  @Delete('gallery/:id')
  async deleteMote(@Param('id') id: string, @Request() req) {
    return this.motesService.deleteMote(id, req.user.id);
  }
}
