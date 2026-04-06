import { Module } from '@nestjs/common';
import { MateriaService } from './materia.service';
import { MateriaController } from './materia.controller';

@Module({
  controllers: [MateriaController],
  providers: [MateriaService],
})
export class MateriaModule {}
