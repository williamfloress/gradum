import { Module } from '@nestjs/common';
import { PensumController } from './pensum.controller';
import { PensumService } from './pensum.service';

@Module({
  controllers: [PensumController],
  providers: [PensumService],
  exports: [PensumService],
})
export class PensumModule {}
