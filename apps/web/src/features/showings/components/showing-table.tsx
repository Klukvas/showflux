'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime } from '@/lib/format';
import type { Showing } from '@/types/showing';

interface ShowingTableProps {
  readonly data: readonly Showing[] | null;
  readonly isLoading: boolean;
}

export function ShowingTable({ data, isLoading }: ShowingTableProps) {
  const router = useRouter();

  const columns = useMemo<Column<Showing>[]>(
    () => [
      {
        key: 'listing',
        header: 'Listing',
        render: (showing) => (
          <div>
            <p className="font-medium">{showing.listing?.address ?? '-'}</p>
            <p className="text-xs text-gray-500">
              {showing.listing?.city}, {showing.listing?.state}
            </p>
          </div>
        ),
      },
      {
        key: 'scheduledAt',
        header: 'Scheduled',
        render: (showing) => formatDateTime(showing.scheduledAt),
      },
      {
        key: 'duration',
        header: 'Duration',
        render: (showing) => `${showing.duration} min`,
      },
      {
        key: 'agent',
        header: 'Agent',
        render: (showing) => showing.agent?.fullName ?? '-',
      },
      {
        key: 'status',
        header: 'Status',
        render: (showing) => <StatusBadge status={showing.status} />,
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(s) => s.id}
      onRowClick={(s) => router.push(`/showings/${s.id}`)}
      emptyTitle="No showings found"
      emptyDescription="Schedule your first showing to get started."
    />
  );
}
