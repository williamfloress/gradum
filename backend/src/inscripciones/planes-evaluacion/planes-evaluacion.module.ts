/**
 * Sprint 6: planes (S6-1/2), evaluaciones (S6-3), nota definitiva (S6-4 §6); rutas /inscripciones/...
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlanesEvaluacionController } from './planes-evaluacion.controller';
import { PlanesEvaluacionService } from './planes-evaluacion.service';
import { EvaluacionesController } from './evaluaciones/evaluaciones.controller';
import { EvaluacionesService } from './evaluaciones/evaluaciones.service';
import { NotaDefinitivaService } from './nota-definitiva.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlanesEvaluacionController, EvaluacionesController],
  providers: [NotaDefinitivaService, PlanesEvaluacionService, EvaluacionesService],
  exports: [NotaDefinitivaService, PlanesEvaluacionService, EvaluacionesService],
})
export class PlanesEvaluacionModule {}
