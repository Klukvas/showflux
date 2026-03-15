"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "../hooks/use-subscription";
import { usePaddle } from "../paddle-provider";
import { PricingCards } from "./pricing-cards";
import type { SubscriptionStatus, Plan } from "@/types/common";

const STATUS_BADGE_MAP: Record<
  SubscriptionStatus,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }
> = {
  trialing: { label: "Trial", variant: "info" },
  active: { label: "Active", variant: "success" },
  past_due: { label: "Past Due", variant: "warning" },
  paused: { label: "Paused", variant: "default" },
  canceled: { label: "Canceled", variant: "danger" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SubscriptionCard() {
  const { subscription, isLoading, createCheckout, cancelSubscription } =
    useSubscription();
  const { paddle } = usePaddle();
  const [showPlans, setShowPlans] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (isLoading || !subscription) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = STATUS_BADGE_MAP[subscription.status];

  const handleSelectPlan = async (plan: Plan) => {
    setActionLoading(true);
    try {
      if (subscription.hasSubscription) {
        await createCheckout(plan);
      } else {
        const result = await createCheckout(plan);
        paddle?.Checkout.open({ transactionId: result.transactionId });
      }
      setShowPlans(false);
    } catch {
      // Error handled by api client
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelSubscription();
    } catch {
      // Error handled by api client
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Plan</span>
              <p className="font-medium capitalize text-gray-900">
                {subscription.plan}
              </p>
            </div>
            {subscription.trialEndsAt && (
              <div>
                <span className="text-gray-500">Trial ends</span>
                <p className="font-medium text-gray-900">
                  {formatDate(subscription.trialEndsAt)}
                </p>
              </div>
            )}
            {subscription.currentPeriodEnd && (
              <div>
                <span className="text-gray-500">Current period ends</span>
                <p className="font-medium text-gray-900">
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            )}
          </div>

          {showPlans ? (
            <div className="space-y-4 pt-4">
              <PricingCards
                currentPlan={subscription.plan}
                onSelect={handleSelectPlan}
                isLoading={actionLoading}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlans(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPlans(true)}
              >
                {subscription.hasSubscription ? "Change Plan" : "Subscribe"}
              </Button>
              {subscription.hasSubscription &&
                subscription.status !== "canceled" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    isLoading={actionLoading}
                  >
                    Cancel Subscription
                  </Button>
                )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
