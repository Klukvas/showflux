'use client';

import { Button } from './button';
import { usePagination } from '@/hooks/use-pagination';

interface PaginationProps {
  readonly total: number;
  readonly page: number;
  readonly limit?: number;
  readonly onPageChange: (page: number) => void;
}

export function Pagination({ total, page, limit, onPageChange }: PaginationProps) {
  const { totalPages, hasNext, hasPrev, nextPage, prevPage } = usePagination({
    total,
    page,
    limit,
    onPageChange,
  });

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={prevPage} disabled={!hasPrev}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" onClick={nextPage} disabled={!hasNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
