import { IsEnum } from 'class-validator';
import { Plan } from '../../common/enums/plan.enum.js';

export class UpdatePlanDto {
  @IsEnum(Plan)
  plan!: Plan;
}
