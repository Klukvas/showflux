import type { Plan, SubscriptionStatus } from "./common";

export interface SubscriptionInfo {
  readonly plan: Plan;
  readonly status: SubscriptionStatus;
  readonly currentPeriodEnd: string | null;
  readonly trialEndsAt: string | null;
  readonly hasSubscription: boolean;
}

export interface CheckoutResult {
  readonly transactionId: string;
}
