/**
 * Planes de evaluación por inscripción (S6-1 + S6-2 + enganche S6-4).
 * S6-2 (§4): suma de porcentajes por inscripción ≤ 100 en POST/PATCH.
 */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanEvaluacionDto } from './dto/create-plan-evaluacion.dto';
import { UpdatePlanEvaluacionDto } from './dto/update-plan-evaluacion.dto';
import {
  excedeCienPorCiento,
  nuevaSumaTrasAnadir,
  nuevaSumaTrasEditar,
  toPorcentajeNumber,
} from './planes-evaluacion-porcentajes.util';
import { NotaDefinitivaService } from './nota-definitiva.service';

@Injectable()
export class PlanesEvaluacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notaDefinitivaService: NotaDefinitivaService,
  ) {}

  /** §3.2 paso 7 / §6: al cambiar pesos o existencia de planes, recalcular nota y estado. */
  private async afterPlanesMutated(inscripcionSemestreId: string): Promise<void> {
    await this.notaDefinitivaService.recalcularNotaDefinitiva(inscripcionSemestreId);
  }

  /** §4.2 paso 1: suma de porcentajes de todos los planes de la inscripción (vía aggregate). */
  private async sumPorcentajesPlanes(inscripcionSemestreId: string): Promise<number> {
    const agg = await this.prisma.planEvaluacion.aggregate({
      where: { inscripcionSemestreId },
      _sum: { porcentaje: true },
    });
    return toPorcentajeNumber(agg._sum.porcentaje);
  }

  /** §4.2 paso 3: 400 si la suma supera 100 %. */
  private assertSumaPorcentajesPermitida(nuevaSuma: number): void {
    if (excedeCienPorCiento(nuevaSuma)) {
      throw new BadRequestException(
        `La suma de porcentajes de los planes no puede superar 100 %. Con este cambio quedaría en ${nuevaSuma.toFixed(2)} %.`,
      );
    }
  }

  /** Comprueba existencia de la inscripción y que inscripcion.usuarioId === usuario autenticado (§3.2 paso 2). */
  private async assertInscripcionOwned(userId: string, inscripcionId: string) {
    const inscripcion = await this.prisma.inscripcionSemestre.findUnique({
      where: { id: inscripcionId },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
    if (inscripcion.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para gestionar esta inscripción');
    }
    return inscripcion;
  }

  /** §3.2 paso 3: listado con evaluaciones anidadas, orden por orden + nombre. */
  async findAllByInscripcion(userId: string, inscripcionId: string) {
    await this.assertInscripcionOwned(userId, inscripcionId);
    return this.prisma.planEvaluacion.findMany({
      where: { inscripcionSemestreId: inscripcionId },
      include: { evaluaciones: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  /** §3.2 paso 4 + §4.2 paso 2 (POST): valida suma ≤ 100 antes de crear. */
  async create(userId: string, inscripcionId: string, dto: CreatePlanEvaluacionDto) {
    await this.assertInscripcionOwned(userId, inscripcionId);
    const sumaActual = await this.sumPorcentajesPlanes(inscripcionId);
    const nuevaSuma = nuevaSumaTrasAnadir(sumaActual, dto.porcentaje);
    this.assertSumaPorcentajesPermitida(nuevaSuma);

    const created = await this.prisma.planEvaluacion.create({
      data: {
        inscripcionSemestreId: inscripcionId,
        nombre: dto.nombre,
        porcentaje: dto.porcentaje,
        orden: dto.orden ?? 0,
      },
      include: { evaluaciones: true },
    });
    await this.afterPlanesMutated(inscripcionId);
    return created;
  }

  /** §3.2 paso 5 + §4.2 paso 2 (PATCH): nuevaSuma = total − aporteAnterior + aporteNuevo. */
  async update(userId: string, inscripcionId: string, planId: string, dto: UpdatePlanEvaluacionDto) {
    await this.assertInscripcionOwned(userId, inscripcionId);
    const plan = await this.prisma.planEvaluacion.findFirst({
      where: { id: planId, inscripcionSemestreId: inscripcionId },
    });
    if (!plan) throw new NotFoundException('Plan de evaluación no encontrado');

    const sumaActual = await this.sumPorcentajesPlanes(inscripcionId);
    const anterior = toPorcentajeNumber(plan.porcentaje);
    const nuevo = dto.porcentaje !== undefined ? dto.porcentaje : anterior;
    const nuevaSuma = nuevaSumaTrasEditar(sumaActual, anterior, nuevo);
    this.assertSumaPorcentajesPermitida(nuevaSuma);

    const updated = await this.prisma.planEvaluacion.update({
      where: { id: planId },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.porcentaje !== undefined && { porcentaje: dto.porcentaje }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
      },
      include: { evaluaciones: true },
    });
    await this.afterPlanesMutated(inscripcionId);
    return updated;
  }

  /** §3.2 paso 6: delete con mismas comprobaciones; cascada de evaluaciones en Prisma. */
  async remove(userId: string, inscripcionId: string, planId: string) {
    await this.assertInscripcionOwned(userId, inscripcionId);
    const plan = await this.prisma.planEvaluacion.findFirst({
      where: { id: planId, inscripcionSemestreId: inscripcionId },
    });
    if (!plan) throw new NotFoundException('Plan de evaluación no encontrado');

    const deleted = await this.prisma.planEvaluacion.delete({
      where: { id: planId },
    });
    await this.afterPlanesMutated(inscripcionId);
    return deleted;
  }
}
