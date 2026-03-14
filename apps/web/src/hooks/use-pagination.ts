'use client';

import { useCallback, useMemo } from 'react';
import { ITEMS_PER_PAGE } from '@/lib/constants';

interface UsePaginationOptions {
  readonly total: number;
  readonly page: number;
  readonly limit?: number;
  readonly onPageChange: (page: number) => void;
}

interface UsePaginationReturn {
  readonly page: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export function usePagination(options: UsePaginationOptions): UsePaginationReturn {
  const { total, page, onPageChange, limit = ITEMS_PER_PAGE } = options;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const goToPage = useCallback(
    (p: number) => {
      if (p >= 1 && p <= totalPages) onPageChange(p);
    },
    [totalPages, onPageChange],
  );

  const nextPage = useCallback(() => {
    if (hasNext) onPageChange(page + 1);
  }, [hasNext, page, onPageChange]);

  const prevPage = useCallback(() => {
    if (hasPrev) onPageChange(page - 1);
  }, [hasPrev, page, onPageChange]);

  return { page, totalPages, hasNext, hasPrev, goToPage, nextPage, prevPage };
}
