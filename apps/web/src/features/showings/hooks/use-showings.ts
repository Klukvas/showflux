"use client";

import { useMemo } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { endpoints } from "@/lib/api-endpoints";
import type { Showing, ShowingFilters } from "@/types/showing";
import type { PaginatedResponse } from "@/types/common";

const defaultFilters: ShowingFilters = { page: 1, limit: 10 };

export function useShowings() {
  const { filters, setFilters } = useUrlFilters<ShowingFilters>(defaultFilters);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.agentId) params.set("agentId", filters.agentId);
    if (filters.listingId) params.set("listingId", filters.listingId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.page != null) params.set("page", String(filters.page));
    if (filters.limit != null) params.set("limit", String(filters.limit));
    return params.toString();
  }, [filters]);

  const result = useFetch<PaginatedResponse<Showing>>(
    `${endpoints.showings.list}?${queryString}`,
  );

  return { ...result, filters, setFilters };
}
