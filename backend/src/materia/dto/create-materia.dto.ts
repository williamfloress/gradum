import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateMateriaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  semestreNumero: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  creditos?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  orden?: number;
}
