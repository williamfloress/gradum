import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDegreeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
