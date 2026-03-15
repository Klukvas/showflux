"use client";

import { useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { endpoints } from "@/lib/api-endpoints";
import type { Listing, ListingFilters } from "@/types/listing";
import type { PaginatedResponse } from "@/types/common";

const defaultFilters: ListingFilters = { page: 1, limit: 10 };

export function useListings() {
  const { filters, setFilters } = useUrlFilters<ListingFilters>(defaultFilters);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.agentId) params.set("agentId", filters.agentId);
    if (filters.city) params.set("city", filters.city);
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.limit != null) params.set("limit", String(filters.limit));
    return params.toString();
  }, [filters]);

  const result = useFetch<PaginatedResponse<Listing>>(
    `${endpoints.listings.list}?${queryString}`,
  );

  return { ...result, filters, setFilters };
}
