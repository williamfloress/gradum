import { PartialType } from '@nestjs/mapped-types';
import { CreateInscripcioneDto } from './create-inscripcione.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateInscripcioneDto extends PartialType(CreateInscripcioneDto) {
  @IsOptional()
  @IsEnum(['en_curso', 'aprobada', 'reprobada'])
  estado?: 'en_curso' | 'aprobada' | 'reprobada';
}
