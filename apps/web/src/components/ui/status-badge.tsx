import { Badge } from './badge';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const statusVariantMap: Record<string, BadgeVariant> = {
  // listing
  active: 'success',
  pending: 'warning',
  sold: 'info',
  withdrawn: 'default',
  // showing
  scheduled: 'info',
  completed: 'success',
  cancelled: 'default',
  no_show: 'danger',
  // offer
  submitted: 'info',
  accepted: 'success',
  rejected: 'danger',
  countered: 'warning',
  expired: 'default',
  // invite
  revoked: 'danger',
};

interface StatusBadgeProps {
  readonly status: string;
  readonly className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusVariantMap[status] ?? 'default';
  const label = status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
