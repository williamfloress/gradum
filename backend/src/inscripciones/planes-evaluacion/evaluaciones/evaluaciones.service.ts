/**
 * CRUD de evaluaciones por plan (S6-3). Tras cambios en `notaReal` recalcula nota definitiva (S6-4).
 */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotaDefinitivaService } from '../nota-definitiva.service';
import { CreateEvaluacionDto } from './dto/create-evaluacion.dto';
import { UpdateEvaluacionDto } from './dto/update-evaluacion.dto';

@Injectable()
export class EvaluacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notaDefinitivaService: NotaDefinitivaService,
  ) {}

  private async afterNotaRealPuedeHaberCambiado(inscripcionSemestreId: string): Promise<void> {
    await this.notaDefinitivaService.recalcularNotaDefinitiva(inscripcionSemestreId);
  }

  /** Plan existe, pertenece a la inscripción del path y el usuario es dueño de esa inscripción (§5.2 paso 1). */
  private async assertPlanAccesiblePorUsuario(userId: string, inscripcionId: string, planId: string) {
    const plan = await this.prisma.planEvaluacion.findFirst({
      where: { id: planId, inscripcionSemestreId: inscripcionId },
      include: { inscripcionSemestre: true },
    });
    if (!plan) throw new NotFoundException('Plan de evaluación no encontrado');
    if (plan.inscripcionSemestre.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para gestionar este plan');
    }
    return plan;
  }

  private buildCreateData(planId: string, dto: CreateEvaluacionDto): Prisma.EvaluacionUncheckedCreateInput {
    const data: Prisma.EvaluacionUncheckedCreateInput = {
      planEvaluacionId: planId,
    };
    if (dto.fechaLimite !== undefined) data.fechaLimite = new Date(dto.fechaLimite);
    if (dto.observacion !== undefined) data.observacion = dto.observacion;
    if (dto.notaEsperada !== undefined) data.notaEsperada = dto.notaEsperada;
    if (dto.notaReal !== undefined) data.notaReal = dto.notaReal;
    if (dto.archivos !== undefined) data.archivos = dto.archivos as Prisma.InputJsonValue;
    return data;
  }

  private buildUpdateData(dto: UpdateEvaluacionDto): Prisma.EvaluacionUncheckedUpdateInput {
    const data: Prisma.EvaluacionUncheckedUpdateInput = {};
    if (dto.fechaLimite !== undefined) {
      data.fechaLimite = dto.fechaLimite === '' ? null : new Date(dto.fechaLimite);
    }
    if (dto.observacion !== undefined) data.observacion = dto.observacion;
    if (dto.notaEsperada !== undefined) data.notaEsperada = dto.notaEsperada;
    if (dto.notaReal !== undefined) data.notaReal = dto.notaReal;
    if (dto.archivos !== undefined) data.archivos = dto.archivos as Prisma.InputJsonValue;
    return data;
  }

  async findAllByPlan(userId: string, inscripcionId: string, planId: string) {
    await this.assertPlanAccesiblePorUsuario(userId, inscripcionId, planId);
    return this.prisma.evaluacion.findMany({
      where: { planEvaluacionId: planId },
      orderBy: { creadoEn: 'asc' },
    });
  }

  async create(userId: string, inscripcionId: string, planId: string, dto: CreateEvaluacionDto) {
    await this.assertPlanAccesiblePorUsuario(userId, inscripcionId, planId);
    const created = await this.prisma.evaluacion.create({
      data: this.buildCreateData(planId, dto),
    });
    if (dto.notaReal !== undefined) {
      await this.afterNotaRealPuedeHaberCambiado(inscripcionId);
    }
    return created;
  }

  async update(
    userId: string,
    inscripcionId: string,
    planId: string,
    evaluacionId: string,
    dto: UpdateEvaluacionDto,
  ) {
    await this.assertPlanAccesiblePorUsuario(userId, inscripcionId, planId);
    const existing = await this.prisma.evaluacion.findFirst({
      where: { id: evaluacionId, planEvaluacionId: planId },
    });
    if (!existing) throw new NotFoundException('Evaluación no encontrada');

    const data = this.buildUpdateData(dto);
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    const updated = await this.prisma.evaluacion.update({
      where: { id: evaluacionId },
      data,
    });
    if (data.notaReal !== undefined) {
      await this.afterNotaRealPuedeHaberCambiado(inscripcionId);
    }
    return updated;
  }

  async remove(userId: string, inscripcionId: string, planId: string, evaluacionId: string) {
    await this.assertPlanAccesiblePorUsuario(userId, inscripcionId, planId);
    const existing = await this.prisma.evaluacion.findFirst({
      where: { id: evaluacionId, planEvaluacionId: planId },
    });
    if (!existing) throw new NotFoundException('Evaluación no encontrada');

    const teniaNotaReal = existing.notaReal != null;
    const deleted = await this.prisma.evaluacion.delete({ where: { id: evaluacionId } });
    if (teniaNotaReal) await this.afterNotaRealPuedeHaberCambiado(inscripcionId);
    return deleted;
  }
}
