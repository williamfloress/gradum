/**
 * PATCH plan (§3.2 paso 5); si cambia porcentaje, el servicio valida suma ≤ 100 % (S6-2 §4).
 */
import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanEvaluacionDto } from './create-plan-evaluacion.dto';

export class UpdatePlanEvaluacionDto extends PartialType(CreatePlanEvaluacionDto) {}
