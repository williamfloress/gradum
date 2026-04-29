/**
 * PATCH evaluación (S6-3 §5); si se envía `notaReal`, tras guardar se disparará recálculo S6-4.
 */
import { PartialType } from '@nestjs/mapped-types';
import { CreateEvaluacionDto } from './create-evaluacion.dto';

export class UpdateEvaluacionDto extends PartialType(CreateEvaluacionDto) {}
