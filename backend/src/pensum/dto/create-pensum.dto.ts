import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreatePensumDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;
}
