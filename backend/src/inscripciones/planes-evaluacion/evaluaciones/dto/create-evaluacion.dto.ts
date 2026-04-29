/**
 * POST evaluación bajo un plan (S6-3 §5); campos alineados con modelo Prisma `Evaluacion`.
 */
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateEvaluacionDto {
  /** Fecha límite (solo fecha); ISO 8601, p. ej. 2026-04-21 */
  @IsOptional()
  @IsDateString()
  fechaLimite?: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  /** Escala típica 0–5 (misma precisión que columnas Decimal en BD). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  notaEsperada?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  notaReal?: number;

  /** URLs u paths ya subidos (S6-5 puede refinar el flujo). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  archivos?: string[];
}
