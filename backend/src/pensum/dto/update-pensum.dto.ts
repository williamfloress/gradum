import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePensumDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;
}
