'use client';

import { useState } from 'react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/format';
import type { Invite } from '@/types/invite';

interface InviteTableProps {
  readonly data: readonly Invite[] | null;
  readonly isLoading: boolean;
  readonly onRevoke: (id: string) => Promise<void>;
}

export function InviteTable({ data, isLoading, onRevoke }: InviteTableProps) {
  const { toast } = useToast();
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    if (!revokeId) return;
    setIsRevoking(true);
    try {
      await onRevoke(revokeId);
      toast('Invite revoked', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to revoke', 'error');
    } finally {
      setIsRevoking(false);
      setRevokeId(null);
    }
  };

  const columns: Column<Invite>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (invite) => invite.email,
    },
    {
      key: 'status',
      header: 'Status',
      render: (invite) => <StatusBadge status={invite.status} />,
    },
    {
      key: 'expires',
      header: 'Expires',
      render: (invite) => formatDate(invite.expiresAt),
    },
    {
      key: 'sent',
      header: 'Sent',
      render: (invite) => formatDate(invite.createdAt),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (invite) =>
        invite.status === 'pending' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setRevokeId(invite.id);
            }}
          >
            Revoke
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        keyExtractor={(i) => i.id}
        emptyTitle="No invites"
        emptyDescription="Send an invite to add team members."
      />
      <ConfirmDialog
        isOpen={!!revokeId}
        onClose={() => setRevokeId(null)}
        onConfirm={handleRevoke}
        title="Revoke Invite"
        message="Are you sure you want to revoke this invite?"
        confirmLabel="Revoke"
        isLoading={isRevoking}
      />
    </>
  );
}
