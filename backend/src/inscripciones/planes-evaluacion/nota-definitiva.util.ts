/**
 * S6-4 (guía §6): fórmula de nota definitiva con opción (B) — varias evaluaciones por plan
 * → promedio de `notaReal` (solo ítems con nota) × porcentaje del plan / 100, sumado en todos los planes.
 *
 * Completitud: todo plan con porcentaje > 0 debe tener al menos una evaluación con `notaReal`;
 * si no hay ningún plan con peso > 0, no hay calificación completa.
 */
import { round2Porcentaje } from './planes-evaluacion-porcentajes.util';

export type PlanNotaInput = {
  porcentaje: number;
  /** Una entrada por evaluación del plan; null = sin nota real. */
  notasReales: (number | null)[];
};

export function computeDefinitivaYCompleto(planes: PlanNotaInput[]): { completo: boolean; nota: number | null } {
  let hayPesoPositivo = false;
  let suma = 0;

  for (const plan of planes) {
    const p = plan.porcentaje;
    if (p <= 0) continue;
    hayPesoPositivo = true;
    const nums = plan.notasReales.filter((n): n is number => n != null && Number.isFinite(n));
    if (nums.length === 0) {
      return { completo: false, nota: null };
    }
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    suma += avg * (p / 100);
  }

  if (!hayPesoPositivo) {
    return { completo: false, nota: null };
  }

  return { completo: true, nota: round2Porcentaje(suma) };
}
