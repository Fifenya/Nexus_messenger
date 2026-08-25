import { Module } from '@nestjs/common';
import { BotsController } from './bots.controller';
import { BotApiController } from './botapi.controller';
import { BotsService } from './bots.service';

@Module({
  controllers: [BotsController, BotApiController],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}