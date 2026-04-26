/**
 * CRUD evaluaciones bajo un plan (S6-3 §5.1). Mismas guardas que inscripciones/planes.
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { EvaluacionesService } from './evaluaciones.service';
import { CreateEvaluacionDto } from './dto/create-evaluacion.dto';
import { UpdateEvaluacionDto } from './dto/update-evaluacion.dto';
import { SupabaseAuthGuard } from '../../../auth/supabase-auth.guard';
import { ApprovedUserGuard } from '../../../auth/approved-user.guard';

/**
 * Rutas:
 * GET/POST   /inscripciones/:inscripcionId/planes-evaluacion/:planId/evaluaciones
 * PATCH/DELETE .../evaluaciones/:evaluacionId
 */
@Controller('inscripciones/:inscripcionId/planes-evaluacion/:planId/evaluaciones')
@UseGuards(SupabaseAuthGuard, ApprovedUserGuard)
export class EvaluacionesController {
  constructor(private readonly evaluacionesService: EvaluacionesService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Param('inscripcionId') inscripcionId: string,
    @Param('planId') planId: string,
  ) {
    return this.evaluacionesService.findAllByPlan(req.user.userId, inscripcionId, planId);
  }

  @Post()
  create(
    @Req() req: any,
    @Param('inscripcionId') inscripcionId: string,
    @Param('planId') planId: string,
    @Body() dto: CreateEvaluacionDto,
  ) {
    return this.evaluacionesService.create(req.user.userId, inscripcionId, planId, dto);
  }

  @Patch(':evaluacionId')
  update(
    @Req() req: any,
    @Param('inscripcionId') inscripcionId: string,
    @Param('planId') planId: string,
    @Param('evaluacionId') evaluacionId: string,
    @Body() dto: UpdateEvaluacionDto,
  ) {
    return this.evaluacionesService.update(req.user.userId, inscripcionId, planId, evaluacionId, dto);
  }

  @Delete(':evaluacionId')
  remove(
    @Req() req: any,
    @Param('inscripcionId') inscripcionId: string,
    @Param('planId') planId: string,
    @Param('evaluacionId') evaluacionId: string,
  ) {
    return this.evaluacionesService.remove(req.user.userId, inscripcionId, planId, evaluacionId);
  }
}
