"use client";

import { cn } from "@/lib/cn";

interface UsageBarProps {
  readonly label: string;
  readonly current: number;
  readonly limit: number | "unlimited";
}

function UsageBar({ label, current, limit }: UsageBarProps) {
  const isUnlimited = limit === "unlimited";
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {current} / {isUnlimited ? "Unlimited" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isNearLimit ? "bg-amber-500" : "bg-blue-500",
              percentage >= 100 && "bg-red-500",
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface PlanUsageProps {
  readonly listings: { current: number; limit: number | "unlimited" };
  readonly users: { current: number; limit: number | "unlimited" };
  readonly showings: { current: number; limit: number | "unlimited" };
}

export function PlanUsage({ listings, users, showings }: PlanUsageProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Plan Usage</h4>
      <UsageBar label="Listings" current={listings.current} limit={listings.limit} />
      <UsageBar label="Users" current={users.current} limit={users.limit} />
      <UsageBar label="Showings (this month)" current={showings.current} limit={showings.limit} />
    </div>
  );
}
