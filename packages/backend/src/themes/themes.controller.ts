import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ThemesService } from './themes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('themes')
@UseGuards(JwtAuthGuard)
export class ThemesController {
  constructor(private themesService: ThemesService) {}

  @Get()
  async getAllThemes() {
    return this.themesService.getAllThemes();
  }

  @Get('mine')
  async getMyThemes(@Request() req) {
    return this.themesService.getMyThemes(req.user.id);
  }

  @Post()
  async createTheme(@Request() req, @Body() body: any) {
    return this.themesService.createTheme(req.user.id, body);
  }

  @Delete(':id')
  async deleteTheme(@Param('id') id: string, @Request() req) {
    return this.themesService.deleteTheme(id, req.user.id);
  }
}
