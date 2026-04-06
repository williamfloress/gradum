import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePrerrequisitoDto {
  @IsNotEmpty()
  @IsString()
  materiaPrerrequisitoId: string;
}
