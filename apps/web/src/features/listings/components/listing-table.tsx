'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/format';
import type { Listing } from '@/types/listing';

interface ListingTableProps {
  readonly data: readonly Listing[] | null;
  readonly isLoading: boolean;
}

export function ListingTable({ data, isLoading }: ListingTableProps) {
  const router = useRouter();

  const columns = useMemo<Column<Listing>[]>(
    () => [
      {
        key: 'address',
        header: 'Address',
        render: (listing) => (
          <div>
            <p className="font-medium">{listing.address}</p>
            <p className="text-xs text-gray-500">
              {listing.city}, {listing.state} {listing.zip}
            </p>
          </div>
        ),
      },
      {
        key: 'price',
        header: 'Price',
        render: (listing) => formatCurrency(listing.price),
      },
      {
        key: 'details',
        header: 'Details',
        render: (listing) => {
          const parts = [];
          if (listing.bedrooms != null) parts.push(`${listing.bedrooms} bd`);
          if (listing.bathrooms != null) parts.push(`${listing.bathrooms} ba`);
          if (listing.sqft != null) parts.push(`${listing.sqft.toLocaleString()} sqft`);
          return parts.join(' / ') || '-';
        },
      },
      {
        key: 'agent',
        header: 'Agent',
        render: (listing) => listing.listingAgent?.fullName ?? '-',
      },
      {
        key: 'status',
        header: 'Status',
        render: (listing) => <StatusBadge status={listing.status} />,
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(l) => l.id}
      onRowClick={(l) => router.push(`/listings/${l.id}`)}
      emptyTitle="No listings found"
      emptyDescription="Create your first listing to get started."
    />
  );
}
