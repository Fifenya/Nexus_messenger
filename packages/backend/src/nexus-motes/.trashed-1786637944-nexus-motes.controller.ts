import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NexusMotesService } from './nexus-motes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMoteDto, SearchMotesDto } from './dto/mote.dto';

@Controller('motes')
@UseGuards(JwtAuthGuard)
export class NexusMotesController {
  constructor(private motesService: NexusMotesService) {}

  @Get()
  async getAllMotes(@Query() query: SearchMotesDto) {
    return this.motesService.getAllMotes(query);
  }

  @Get('mine')
  async getMyMotes(@Request() req) {
    return this.motesService.getUserMotes(req.user.id);
  }

  @Post()
  async createMote(@Request() req, @Body() body: CreateMoteDto) {
    return this.motesService.createMote(req.user.id, body);
  }

  @Delete(':id')
  async deleteMote(@Param('id') id: string, @Request() req) {
    return this.motesService.deleteMote(id, req.user.id);
  }
}