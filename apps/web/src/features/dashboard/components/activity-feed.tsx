'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ActivityItem } from './activity-item';
import type { Activity } from '@/types/activity';
import type { PaginatedResponse } from '@/types/common';

interface ActivityFeedProps {
  readonly data: PaginatedResponse<Activity> | null;
  readonly isLoading: boolean;
}

export function ActivityFeed({ data, isLoading }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No recent activity</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.data.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
