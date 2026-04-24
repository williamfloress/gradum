/**
 * S6-2 (guía §4): cálculo de suma de porcentajes sin depender de Prisma — fácil de testear.
 */

/** Convierte Decimal de Prisma u otro valor numérico a number estable. */
export function toPorcentajeNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const n = Number((value as { toString: () => string }).toString());
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Redondeo a 2 decimales alineado con @db.Decimal(5, 2) del campo porcentaje. */
export function round2Porcentaje(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Suma actual + nuevo plan (POST). */
export function nuevaSumaTrasAnadir(sumaActual: number, nuevoPorcentaje: number): number {
  return round2Porcentaje(sumaActual + nuevoPorcentaje);
}

/** Suma total tras reemplazar el aporte de un plan editado (PATCH). */
export function nuevaSumaTrasEditar(
  sumaActualTodosLosPlanes: number,
  porcentajeAnteriorDelPlan: number,
  porcentajeNuevoDelPlan: number,
): number {
  return round2Porcentaje(sumaActualTodosLosPlanes - porcentajeAnteriorDelPlan + porcentajeNuevoDelPlan);
}

/** true si supera el 100 % permitido (comparación en 2 decimales). */
export function excedeCienPorCiento(nuevaSuma: number): boolean {
  return round2Porcentaje(nuevaSuma) > 100;
}
