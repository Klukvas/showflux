'use client';

import { useFetch } from '@/hooks/use-fetch';
import { endpoints } from '@/lib/api-endpoints';
import type { Showing } from '@/types/showing';

export function useShowing(id: string) {
  return useFetch<Showing>(endpoints.showings.get(id));
}
