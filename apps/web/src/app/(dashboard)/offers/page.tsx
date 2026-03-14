'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useOffers } from '@/features/offers/hooks/use-offers';
import { OfferFiltersBar } from '@/features/offers/components/offer-filters';
import { OfferTable } from '@/features/offers/components/offer-table';

export default function OffersPage() {
  const { data, isLoading, filters, setFilters } = useOffers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers"
        actions={
          <Link href="/offers/new">
            <Button>New Offer</Button>
          </Link>
        }
      />
      <OfferFiltersBar filters={filters} onFilterChange={setFilters} />
      <OfferTable data={data?.data ?? null} isLoading={isLoading} />
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
