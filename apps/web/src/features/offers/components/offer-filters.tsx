'use client';

import { useCallback } from 'react';
import { Select } from '@/components/ui/select';
import type { OfferFilters } from '@/types/offer';

const statusOptions = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'countered', label: 'Countered' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'expired', label: 'Expired' },
];

interface OfferFiltersBarProps {
  readonly filters: OfferFilters;
  readonly onFilterChange: (filters: OfferFilters) => void;
}

export function OfferFiltersBar({ filters, onFilterChange }: OfferFiltersBarProps) {
  const updateFilter = useCallback(
    (key: keyof OfferFilters, value: string) => {
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
    </div>
  );
}
