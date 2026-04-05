import { Module } from '@nestjs/common';
import { PrerrequisitosService } from './prerrequisitos.service';
import { PrerrequisitosController } from './prerrequisitos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrerrequisitosController],
  providers: [PrerrequisitosService],
})
export class PrerrequisitosModule {}
