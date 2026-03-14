import type { User } from './user';

export type ActivityAction =
  | 'listing_created'
  | 'listing_updated'
  | 'listing_deleted'
  | 'showing_scheduled'
  | 'showing_updated'
  | 'showing_completed'
  | 'offer_submitted'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_updated'
  | 'invite_sent'
  | 'invite_accepted'
  | 'member_deactivated'
  | 'member_reactivated';

export interface Activity {
  readonly id: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly user?: User;
  readonly action: ActivityAction;
  readonly entityType: string;
  readonly entityId: string;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
}
