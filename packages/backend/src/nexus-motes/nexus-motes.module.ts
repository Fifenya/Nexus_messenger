import { Module } from '@nestjs/common';
import { NexusMotesController } from './nexus-motes.controller';
import { NexusMotesService } from './nexus-motes.service';

@Module({
  controllers: [NexusMotesController],
  providers: [NexusMotesService],
  exports: [NexusMotesService],
})
export class NexusMotesModule {}
