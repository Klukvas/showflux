'use client';

import { useFetch } from '@/hooks/use-fetch';
import { endpoints } from '@/lib/api-endpoints';
import type { Listing } from '@/types/listing';

export function useListing(id: string) {
  return useFetch<Listing>(endpoints.listings.get(id));
}
