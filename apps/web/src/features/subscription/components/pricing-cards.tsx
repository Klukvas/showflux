"use client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/types/common";

interface PlanConfig {
  readonly plan: Plan;
  readonly name: string;
  readonly price: string;
  readonly period: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly highlighted?: boolean;
}

const PLANS: readonly PlanConfig[] = [
  {
    plan: "solo",
    name: "Solo",
    price: "$29",
    period: "/month",
    description: "For individual brokers getting started.",
    features: [
      "Up to 10 listings",
      "1 user",
      "50 showings/month",
      "Email support",
    ],
  },
  {
    plan: "team",
    name: "Team",
    price: "$79",
    period: "/month",
    description: "For growing brokerages with a team.",
    features: [
      "Up to 50 listings",
      "5 users",
      "500 showings/month",
      "Priority support",
      "Team collaboration",
    ],
    highlighted: true,
  },
  {
    plan: "agency",
    name: "Agency",
    price: "$199",
    period: "/month",
    description: "For large brokerages that need it all.",
    features: [
      "Unlimited listings",
      "Unlimited users",
      "Unlimited showings",
      "Dedicated support",
      "Advanced analytics",
      "Custom integrations",
    ],
  },
];

interface PricingCardsProps {
  readonly currentPlan?: Plan;
  readonly onSelect?: (plan: Plan) => void;
  readonly isLoading?: boolean;
}

export function PricingCards({
  currentPlan,
  onSelect,
  isLoading,
}: PricingCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLANS.map((config) => {
        const isCurrent = currentPlan === config.plan;
        return (
          <div
            key={config.plan}
            className={cn(
              "relative flex flex-col rounded-xl border p-6",
              config.highlighted
                ? "border-blue-500 shadow-lg ring-1 ring-blue-500"
                : "border-gray-200 shadow-sm",
            )}
          >
            {config.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </span>
            )}

            <h3 className="text-lg font-semibold text-gray-900">
              {config.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{config.description}</p>

            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-gray-900">
                {config.price}
              </span>
              <span className="ml-1 text-gray-500">{config.period}</span>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {config.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="mt-6 w-full"
              variant={config.highlighted ? "primary" : "secondary"}
              disabled={isCurrent || isLoading}
              isLoading={isLoading}
              onClick={() => onSelect?.(config.plan)}
            >
              {isCurrent ? "Current Plan" : "Select Plan"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
