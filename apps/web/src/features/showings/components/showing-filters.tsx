'use client';

import { useCallback } from 'react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { ShowingFilters } from '@/types/showing';

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

interface ShowingFiltersBarProps {
  readonly filters: ShowingFilters;
  readonly onFilterChange: (filters: ShowingFilters) => void;
}

export function ShowingFiltersBar({ filters, onFilterChange }: ShowingFiltersBarProps) {
  const updateFilter = useCallback(
    (key: keyof ShowingFilters, value: string) => {
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
      <div className="w-44">
        <Input
          label="From"
          type="date"
          value={filters.from ?? ''}
          onChange={(e) => updateFilter('from', e.target.value)}
        />
      </div>
      <div className="w-44">
        <Input
          label="To"
          type="date"
          value={filters.to ?? ''}
          onChange={(e) => updateFilter('to', e.target.value)}
        />
      </div>
    </div>
  );
}
