import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { TipoIngreso } from '@prisma/client';

export class CreatePerfilDto {
  /** ID de la carrera que el estudiante elige en el onboarding */
  @IsString()
  @IsNotEmpty()
  carreraId: string;

  /**
   * ID del pensum que el estudiante quiere usar.
   * Si se omite, el backend asigna automáticamente el pensum vigente de la carrera.
   */
  @IsString()
  @IsOptional()
  pensumId?: string;

  /** Tipo de ingreso: primer_semestre (autoinscripción automática) | avanzado */
  @IsEnum(TipoIngreso)
  @IsNotEmpty()
  tipoIngreso: TipoIngreso;

  /**
   * Etiqueta del semestre actual, ej. "2025-1".
   * Se usa para registrar las inscripciones automáticas.
   */
  @IsString()
  @IsNotEmpty()
  semestreActual: string;
}
