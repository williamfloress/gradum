import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInscripcioneDto {
  @IsNotEmpty()
  @IsString()
  materiaId: string;

  @IsNotEmpty()
  @IsString()
  semestre_etiqueta: string;
}
