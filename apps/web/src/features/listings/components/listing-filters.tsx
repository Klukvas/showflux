'use client';

import { useCallback } from 'react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { ListingFilters } from '@/types/listing';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'sold', label: 'Sold' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

interface ListingFiltersBarProps {
  readonly filters: ListingFilters;
  readonly onFilterChange: (filters: ListingFilters) => void;
}

export function ListingFiltersBar({ filters, onFilterChange }: ListingFiltersBarProps) {
  const updateFilter = useCallback(
    (key: keyof ListingFilters, value: string) => {
      onFilterChange({
        ...filters,
        [key]: value || undefined,
        page: 1,
      });
    },
    [filters, onFilterChange],
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-40">
        <Select
          label="Status"
          options={statusOptions}
          placeholder="All statuses"
          value={filters.status ?? ''}
          onChange={(e) => updateFilter('status', e.target.value)}
        />
      </div>
      <div className="w-40">
        <Input
          label="City"
          placeholder="Filter by city"
          value={filters.city ?? ''}
          onChange={(e) => updateFilter('city', e.target.value)}
        />
      </div>
      <div className="w-36">
        <Input
          label="Min Price"
          type="number"
          placeholder="0"
          value={filters.minPrice ?? ''}
          onChange={(e) => updateFilter('minPrice', e.target.value)}
        />
      </div>
      <div className="w-36">
        <Input
          label="Max Price"
          type="number"
          placeholder="Any"
          value={filters.maxPrice ?? ''}
          onChange={(e) => updateFilter('maxPrice', e.target.value)}
        />
      </div>
    </div>
  );
}
