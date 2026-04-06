import { PartialType } from '@nestjs/mapped-types';
import { CreatePrerrequisitoDto } from './create-prerrequisito.dto';

export class UpdatePrerrequisitoDto extends PartialType(CreatePrerrequisitoDto) { }
