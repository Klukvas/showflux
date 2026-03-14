'use client';

import { useState, useMemo } from 'react';
import { useFetch } from '@/hooks/use-fetch';
import { endpoints } from '@/lib/api-endpoints';
import type { Listing, ListingFilters } from '@/types/listing';
import type { PaginatedResponse } from '@/types/common';

export function useListings(initialFilters?: ListingFilters) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters ?? { page: 1, limit: 10 });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.agentId) params.set('agentId', filters.agentId);
    if (filters.city) params.set('city', filters.city);
    if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    return params.toString();
  }, [filters]);

  const result = useFetch<PaginatedResponse<Listing>>(
    `${endpoints.listings.list}?${queryString}`,
  );

  return { ...result, filters, setFilters };
}
