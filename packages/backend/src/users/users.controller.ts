import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.usersService.search(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/push-token')
  registerPushToken(@CurrentUser() user: any, @Body('token') token: string) {
    return this.usersService.setPushToken(user.id, token);
  }
}
