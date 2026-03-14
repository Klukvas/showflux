'use client';

import { useFetch } from '@/hooks/use-fetch';
import { endpoints } from '@/lib/api-endpoints';
import { PageHeader } from '@/components/ui/page-header';
import { SummaryCards } from '@/features/dashboard/components/summary-cards';
import { ActivityFeed } from '@/features/dashboard/components/activity-feed';
import type { DashboardSummary } from '@/types/dashboard';
import type { Activity } from '@/types/activity';
import type { PaginatedResponse } from '@/types/common';

export default function DashboardPage() {
  const summary = useFetch<DashboardSummary>(endpoints.dashboard.summary);
  const activity = useFetch<PaginatedResponse<Activity>>(`${endpoints.activity.list}?limit=10`);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your workspace" />
      <SummaryCards data={summary.data} isLoading={summary.isLoading} />
      <ActivityFeed data={activity.data} isLoading={activity.isLoading} />
    </div>
  );
}
