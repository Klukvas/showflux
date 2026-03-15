import { Plan } from '../enums/plan.enum.js';

export type PlanLimitResource = 'listings' | 'users' | 'showings';

export interface PlanLimits {
  readonly listings: number;
  readonly users: number;
  readonly showings: number;
}

export const PLAN_LIMITS: Readonly<Record<Plan, PlanLimits>> = {
  [Plan.SOLO]: { listings: 10, users: 1, showings: 50 },
  [Plan.TEAM]: { listings: 50, users: 5, showings: 500 },
  [Plan.AGENCY]: { listings: Infinity, users: Infinity, showings: Infinity },
};
