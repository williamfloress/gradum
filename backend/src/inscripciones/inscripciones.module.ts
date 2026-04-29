/**
 * Inscripciones semestre (Sprint 5). Sprint 6: importa PlanesEvaluacionModule (guía §3.2).
 */
import { Module } from '@nestjs/common';
import { InscripcionesService } from './inscripciones.service';
import { InscripcionesController } from './inscripciones.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PlanesEvaluacionModule } from './planes-evaluacion/planes-evaluacion.module';

@Module({
  imports: [PrismaModule, PlanesEvaluacionModule],
  controllers: [InscripcionesController],
  providers: [InscripcionesService],
  exports: [InscripcionesService, PlanesEvaluacionModule],
})
export class InscripcionesModule {}
