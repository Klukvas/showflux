import { formatRelativeTime } from '@/lib/format';
import type { Activity, ActivityAction } from '@/types/activity';

const actionLabels: Record<ActivityAction, string> = {
  listing_created: 'created a listing',
  listing_updated: 'updated a listing',
  listing_deleted: 'deleted a listing',
  showing_scheduled: 'scheduled a showing',
  showing_updated: 'updated a showing',
  showing_completed: 'completed a showing',
  offer_submitted: 'submitted an offer',
  offer_accepted: 'accepted an offer',
  offer_rejected: 'rejected an offer',
  offer_updated: 'updated an offer',
  invite_sent: 'sent an invite',
  invite_accepted: 'accepted an invite',
  member_deactivated: 'deactivated a member',
  member_reactivated: 'reactivated a member',
};

interface ActivityItemProps {
  readonly activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const label = actionLabels[activity.action] ?? activity.action;
  const userName = activity.user?.fullName ?? 'Someone';

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
        {userName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{userName}</span>{' '}
          {label}
        </p>
        <p className="text-xs text-gray-500">{formatRelativeTime(activity.createdAt)}</p>
      </div>
    </div>
  );
}
