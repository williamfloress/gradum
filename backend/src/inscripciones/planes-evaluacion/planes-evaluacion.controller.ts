/**
 * API HTTP planes de evaluación (S6-1 diseño §3.1; módulo y flujo §3.2).
 * Guardas: Supabase + usuario aprobado; el servicio valida dueño de la inscripción.
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PlanesEvaluacionService } from './planes-evaluacion.service';
import { CreatePlanEvaluacionDto } from './dto/create-plan-evaluacion.dto';
import { UpdatePlanEvaluacionDto } from './dto/update-plan-evaluacion.dto';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../../auth/approved-user.guard';

/**
 * Prefijo de rutas (sin API global en main.ts):
 * - GET/POST    /inscripciones/:inscripcionId/planes-evaluacion
 * - PATCH/DELETE /inscripciones/:inscripcionId/planes-evaluacion/:planId
 */
@Controller('inscripciones/:inscripcionId/planes-evaluacion')
@UseGuards(SupabaseAuthGuard, ApprovedUserGuard)
export class PlanesEvaluacionController {
  constructor(private readonly planesEvaluacionService: PlanesEvaluacionService) {}

  /** Listado de planes de la inscripción (orden + nombre) con evaluaciones incluidas. */
  @Get()
  findAll(@Req() req: any, @Param('inscripcionId') inscripcionId: string) {
    return this.planesEvaluacionService.findAllByInscripcion(req.user.userId, inscripcionId);
  }

  /** Crea un plan; el servicio valida propiedad de la inscripción. */
  @Post()
  create(
    @Req() req: any,
    @Param('inscripcionId') inscripcionId: string,
    @Body() dto: CreatePlanEvaluacionDto,
  ) {
    return this.planesEvaluacionService.create(req.user.userId, inscripcionId, dto);
  }

  /** Actualiza nombre, porcentaje u orden del plan identificado. */
  @Patch(':planId')
  update(
    @Req() req: any,
    @Param('inscripcionId') inscripcionId: string,
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanEvaluacionDto,
  ) {
    return this.planesEvaluacionService.update(req.user.userId, inscripcionId, planId, dto);
  }

  /** Elimina el plan (y en cascada sus evaluaciones en base de datos). */
  @Delete(':planId')
  remove(
    @Req() req: any,
    @Param('inscripcionId') inscripcionId: string,
    @Param('planId') planId: string,
  ) {
    return this.planesEvaluacionService.remove(req.user.userId, inscripcionId, planId);
  }
}
