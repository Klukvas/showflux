'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Offer } from '@/types/offer';

interface OfferTableProps {
  readonly data: readonly Offer[] | null;
  readonly isLoading: boolean;
}

export function OfferTable({ data, isLoading }: OfferTableProps) {
  const router = useRouter();

  const columns = useMemo<Column<Offer>[]>(
    () => [
      {
        key: 'listing',
        header: 'Listing',
        render: (offer) => (
          <div>
            <p className="font-medium">{offer.listing?.address ?? '-'}</p>
            <p className="text-xs text-gray-500">
              {offer.listing?.city}, {offer.listing?.state}
            </p>
          </div>
        ),
      },
      {
        key: 'buyerName',
        header: 'Buyer',
        render: (offer) => offer.buyerName,
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (offer) => formatCurrency(offer.offerAmount),
      },
      {
        key: 'submitted',
        header: 'Submitted',
        render: (offer) => formatDate(offer.submittedAt),
      },
      {
        key: 'agent',
        header: 'Agent',
        render: (offer) => offer.agent?.fullName ?? '-',
      },
      {
        key: 'status',
        header: 'Status',
        render: (offer) => <StatusBadge status={offer.status} />,
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(o) => o.id}
      onRowClick={(o) => router.push(`/offers/${o.id}`)}
      emptyTitle="No offers found"
      emptyDescription="Submit your first offer to get started."
    />
  );
}
