/**
 * S6-4: recalcula `notaDefinitiva` y `estado` de `InscripcionSemestre` según guía §6.
 * Invocado desde cambios en evaluaciones (nota real) y en planes (pesos).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toPorcentajeNumber } from './planes-evaluacion-porcentajes.util';
import { computeDefinitivaYCompleto, PlanNotaInput } from './nota-definitiva.util';

const NOTA_MINIMA_APROBACION_DEFAULT = 3;

@Injectable()
export class NotaDefinitivaService {
  constructor(private readonly prisma: PrismaService) {}

  private notaMinimaAprobacion(): number {
    const raw = process.env.NOTA_MINIMA_APROBACION;
    const n = raw !== undefined ? Number(raw) : NOTA_MINIMA_APROBACION_DEFAULT;
    return Number.isFinite(n) ? n : NOTA_MINIMA_APROBACION_DEFAULT;
  }

  /**
   * Lee planes y evaluaciones, aplica fórmula §6.1 (opción B en util) y persiste §6.2.
   * Incompleto → `en_curso` y `notaDefinitiva` null; completo → aprobada/reprobada según umbral.
   */
  async recalcularNotaDefinitiva(inscripcionSemestreId: string): Promise<void> {
    const notaMin = this.notaMinimaAprobacion();

    await this.prisma.$transaction(async (tx) => {
      const planes = await tx.planEvaluacion.findMany({
        where: { inscripcionSemestreId },
        include: { evaluaciones: true },
      });

      const inputs: PlanNotaInput[] = planes.map((plan) => ({
        porcentaje: toPorcentajeNumber(plan.porcentaje),
        notasReales: plan.evaluaciones.map((e) =>
          e.notaReal == null ? null : toPorcentajeNumber(e.notaReal),
        ),
      }));

      const { completo, nota } = computeDefinitivaYCompleto(inputs);

      const estado =
        completo && nota != null
          ? nota >= notaMin
            ? 'aprobada'
            : 'reprobada'
          : 'en_curso';

      await tx.inscripcionSemestre.update({
        where: { id: inscripcionSemestreId },
        data: {
          notaDefinitiva: completo && nota != null ? nota : null,
          estado,
        },
      });
    });
  }
}
