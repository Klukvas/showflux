'use client';

import { useFetch } from '@/hooks/use-fetch';
import { endpoints } from '@/lib/api-endpoints';
import type { Offer } from '@/types/offer';

export function useOffer(id: string) {
  return useFetch<Offer>(endpoints.offers.get(id));
}
