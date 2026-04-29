/**
 * POST planes-evaluación (S6-1); class-validator (§3.2).
 * Suma de % por inscripción ≤ 100: validada en servicio (S6-2 §4).
 */
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePlanEvaluacionDto {
  /** Nombre visible del bloque de evaluación (p. ej. "Parcial", "Proyecto"). */
  @IsNotEmpty()
  @IsString()
  nombre: string;

  /** Peso del plan respecto al 100 % de la materia (0–100 por fila). */
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje: number;

  /** Orden de listado; menor valor aparece primero junto con el criterio nombre. */
  @IsOptional()
  @IsInt()
  orden?: number;
}
