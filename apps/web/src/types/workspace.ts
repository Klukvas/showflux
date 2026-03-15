import type { Plan, SubscriptionStatus } from "./common";

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly plan: Plan;
  readonly subscriptionStatus: SubscriptionStatus;
  readonly currentPeriodEnd: string | null;
  readonly trialEndsAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpdateWorkspaceDto {
  readonly name: string;
}
