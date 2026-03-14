'use client';

import { useState, useMemo } from 'react';
import { useFetch } from '@/hooks/use-fetch';
import { endpoints } from '@/lib/api-endpoints';
import type { Offer, OfferFilters } from '@/types/offer';
import type { PaginatedResponse } from '@/types/common';

export function useOffers(initialFilters?: OfferFilters) {
  const [filters, setFilters] = useState<OfferFilters>(initialFilters ?? { page: 1, limit: 10 });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.agentId) params.set('agentId', filters.agentId);
    if (filters.listingId) params.set('listingId', filters.listingId);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    return params.toString();
  }, [filters]);

  const result = useFetch<PaginatedResponse<Offer>>(
    `${endpoints.offers.list}?${queryString}`,
  );

  return { ...result, filters, setFilters };
}
