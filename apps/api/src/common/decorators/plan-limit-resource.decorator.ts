import { SetMetadata } from '@nestjs/common';
import type { PlanLimitResource as PlanLimitResourceType } from '../constants/plan-limits.constants.js';

export const PLAN_LIMIT_RESOURCE_KEY = 'plan_limit_resource';

export const PlanLimitResource = (resource: PlanLimitResourceType) =>
  SetMetadata(PLAN_LIMIT_RESOURCE_KEY, resource);
