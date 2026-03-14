'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useShowings } from '@/features/showings/hooks/use-showings';
import { ShowingFiltersBar } from '@/features/showings/components/showing-filters';
import { ShowingTable } from '@/features/showings/components/showing-table';

export default function ShowingsPage() {
  const { data, isLoading, filters, setFilters } = useShowings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Showings"
        actions={
          <Link href="/showings/new">
            <Button>Schedule Showing</Button>
          </Link>
        }
      />
      <ShowingFiltersBar filters={filters} onFilterChange={setFilters} />
      <ShowingTable data={data?.data ?? null} isLoading={isLoading} />
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
