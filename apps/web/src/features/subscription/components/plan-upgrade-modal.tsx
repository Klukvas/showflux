"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { PricingCards } from "./pricing-cards";
import { useSubscription } from "../hooks/use-subscription";
import { usePaddle } from "../paddle-provider";
import type { Plan } from "@/types/common";

interface PlanUpgradeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly message?: string;
}

export function PlanUpgradeModal({
  isOpen,
  onClose,
  message,
}: PlanUpgradeModalProps) {
  const { subscription, createCheckout } = useSubscription();
  const { paddle } = usePaddle();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (plan: Plan) => {
    setIsLoading(true);
    try {
      const result = await createCheckout(plan);
      if (subscription?.hasSubscription) {
        onClose();
      } else {
        paddle?.Checkout.open({ transactionId: result.transactionId });
        onClose();
      }
    } catch {
      // Error handled by api client
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade Your Plan"
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {message && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </p>
        )}
        <PricingCards
          currentPlan={subscription?.plan}
          onSelect={handleSelect}
          isLoading={isLoading}
        />
      </div>
    </Modal>
  );
}
