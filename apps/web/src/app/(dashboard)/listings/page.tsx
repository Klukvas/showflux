'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useListings } from '@/features/listings/hooks/use-listings';
import { ListingFiltersBar } from '@/features/listings/components/listing-filters';
import { ListingTable } from '@/features/listings/components/listing-table';

export default function ListingsPage() {
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
