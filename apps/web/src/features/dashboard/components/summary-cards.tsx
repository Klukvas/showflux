'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { DashboardSummary } from '@/types/dashboard';

interface SummaryCardProps {
  readonly title: string;
  readonly value: number;
  readonly subtitle: string;
  readonly color: string;
}

function SummaryCard({ title, value, subtitle, color }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className={`h-3 w-3 rounded-full ${color}`} />
        </div>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

interface SummaryCardsProps {
  readonly data: DashboardSummary | null;
  readonly isLoading: boolean;
}

export function SummaryCards({ data, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Listings"
        value={data.listings.total}
        subtitle={`${data.listings.active} active, ${data.listings.pending} pending`}
        color="bg-blue-500"
      />
      <SummaryCard
        title="Showings"
        value={data.showings.total}
        subtitle={`${data.showings.scheduled} scheduled, ${data.showings.completed} completed`}
        color="bg-green-500"
      />
      <SummaryCard
        title="Offers"
        value={data.offers.total}
        subtitle={`${data.offers.submitted} submitted, ${data.offers.accepted} accepted`}
        color="bg-yellow-500"
      />
      <SummaryCard
        title="Team"
        value={data.team.total}
        subtitle={`${data.team.active} active members`}
        color="bg-purple-500"
      />
    </div>
  );
}
