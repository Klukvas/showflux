"use client";

import { useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { api } from "@/lib/api-client";
import { endpoints } from "@/lib/api-endpoints";
import type { Plan } from "@/types/common";
import type { SubscriptionInfo, CheckoutResult } from "@/types/subscription";

export function useSubscription() {
  const { data, error, isLoading, refetch } = useFetch<SubscriptionInfo>(
    endpoints.subscription.status,
  );

  const createCheckout = useCallback(
    async (plan: Plan): Promise<CheckoutResult> => {
      const result = await api.post<CheckoutResult>(
        endpoints.subscription.checkout,
        { plan },
      );
      return result;
    },
    [],
  );

  const cancelSubscription = useCallback(async (): Promise<void> => {
    await api.post(endpoints.subscription.cancel);
    refetch();
  }, [refetch]);

  const updatePlan = useCallback(
    async (plan: Plan): Promise<void> => {
      await api.post(endpoints.subscription.updatePlan, { plan });
      refetch();
    },
    [refetch],
  );

  return {
    subscription: data,
    error,
    isLoading,
    refetch,
    createCheckout,
    cancelSubscription,
    updatePlan,
  };
}
