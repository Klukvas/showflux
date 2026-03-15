'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { useListings } from '@/features/listings/hooks/use-listings';
import { ListingFiltersBar } from '@/features/listings/components/listing-filters';
import { ListingTable } from '@/features/listings/components/listing-table';

function ListingsContent() {
  const { data, isLoading, filters, setFilters } = useListings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listings"
        actions={
          <Link href="/listings/new">
            <Button>New Listing</Button>
          </Link>
        }
      />
      <ListingFiltersBar filters={filters} onFilterChange={setFilters} />
      <ListingTable data={data?.data ?? null} isLoading={isLoading} />
      {data && (
        <Pagination
          total={data.total}
          page={data.page}
          limit={data.limit}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
      <ListingsContent />
    </Suspense>
  );
}
