import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePrivacyDto } from './dto/privacy.dto';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private privacyService: PrivacyService) {}

  @Get()
  async getPrivacy(@Request() req) {
    return this.privacyService.getPrivacySettings(req.user.id);
  }

  @Put()
  async updatePrivacy(@Request() req, @Body() body: UpdatePrivacyDto) {
    return this.privacyService.updatePrivacySettings(req.user.id, body);
  }
}