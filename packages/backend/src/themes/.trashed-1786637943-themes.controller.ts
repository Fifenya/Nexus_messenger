import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ThemesService } from './themes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateThemeDto, UpdateThemeDto } from './dto/theme.dto';

@Controller('themes')
@UseGuards(JwtAuthGuard)
export class ThemesController {
  constructor(private themesService: ThemesService) {}

  @Get()
  async getAllThemes() {
    return this.themesService.getAllThemes();
  }

  @Get('active')
  async getActiveTheme(@Request() req) {
    return this.themesService.getActiveTheme(req.user.id);
  }

  @Get('default')
  async getDefaultTheme() {
    return this.themesService.getDefaultTheme();
  }

  @Post()
  async createTheme(@Request() req, @Body() body: CreateThemeDto) {
    return this.themesService.createTheme(req.user.id, body);
  }

  @Put(':id/activate')
  async activateTheme(@Param('id') id: string, @Request() req) {
    return this.themesService.activateTheme(req.user.id, id);
  }

  @Put(':id')
  async updateTheme(
    @Param('id') id: string,
    @Body() body: UpdateThemeDto,
    @Request() req,
  ) {
    return this.themesService.updateTheme(id, req.user.id, body);
  }

  @Delete(':id')
  async deleteTheme(@Param('id') id: string, @Request() req) {
    return this.themesService.deleteTheme(id, req.user.id);
  }

  @Post(':id/export')
  async exportTheme(@Param('id') id: string) {
    return this.themesService.exportTheme(id);
  }

  @Post('import')
  async importTheme(@Request() req, @Body() body: any) {
    return this.themesService.importTheme(req.user.id, body);
  }
}