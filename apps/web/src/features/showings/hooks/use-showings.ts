'use client';

import { useState, useMemo } from 'react';
import { useFetch } from '@/hooks/use-fetch';
import { endpoints } from '@/lib/api-endpoints';
import type { Showing, ShowingFilters } from '@/types/showing';
import type { PaginatedResponse } from '@/types/common';

export function useShowings(initialFilters?: ShowingFilters) {
  const [filters, setFilters] = useState<ShowingFilters>(initialFilters ?? { page: 1, limit: 10 });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.agentId) params.set('agentId', filters.agentId);
    if (filters.listingId) params.set('listingId', filters.listingId);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    return params.toString();
  }, [filters]);

  const result = useFetch<PaginatedResponse<Showing>>(
    `${endpoints.showings.list}?${queryString}`,
  );

  return { ...result, filters, setFilters };
}
