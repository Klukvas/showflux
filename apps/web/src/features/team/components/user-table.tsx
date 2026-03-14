'use client';

import { useState } from 'react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/format';
import type { User } from '@/types/user';

interface UserTableProps {
  readonly data: readonly User[] | null;
  readonly isLoading: boolean;
  readonly onToggleActive: (user: User) => Promise<void>;
}

export function UserTable({ data, isLoading, onToggleActive }: UserTableProps) {
  const { toast } = useToast();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const handleConfirm = async () => {
    if (!targetUser) return;
    setIsToggling(true);
    try {
      await onToggleActive(targetUser);
      toast(
        `${targetUser.fullName} ${targetUser.isActive ? 'deactivated' : 'reactivated'}`,
        'success',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setIsToggling(false);
      setTargetUser(null);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <div>
          <p className="font-medium">{user.fullName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge variant={user.role === 'broker' ? 'info' : 'default'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'danger'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (user) => (
        <Button
          variant={user.isActive ? 'ghost' : 'secondary'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setTargetUser(user);
          }}
        >
          {user.isActive ? 'Deactivate' : 'Reactivate'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        keyExtractor={(u) => u.id}
        emptyTitle="No team members"
      />
      <ConfirmDialog
        isOpen={!!targetUser}
        onClose={() => setTargetUser(null)}
        onConfirm={handleConfirm}
        title={targetUser?.isActive ? 'Deactivate Member' : 'Reactivate Member'}
        message={
          targetUser?.isActive
            ? `Are you sure you want to deactivate ${targetUser?.fullName}? They will lose access to the workspace.`
            : `Are you sure you want to reactivate ${targetUser?.fullName}?`
        }
        confirmLabel={targetUser?.isActive ? 'Deactivate' : 'Reactivate'}
        isLoading={isToggling}
      />
    </>
  );
}
