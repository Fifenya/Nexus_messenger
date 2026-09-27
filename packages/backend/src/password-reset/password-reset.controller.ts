import { Body, Controller, Post } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly service: PasswordResetService) {}

  @Post('forgot')
  forgot(@Body() body: { username?: string; lastPassword?: string }) {
    return this.service.forgot(body.username || '', body.lastPassword || '');
  }

  @Post('reset')
  reset(@Body() body: { username?: string; code?: string; newPassword?: string }) {
    return this.service.reset(body.username || '', body.code || '', body.newPassword || '');
  }
}
