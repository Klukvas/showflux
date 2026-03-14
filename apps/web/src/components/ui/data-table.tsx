'use client';

import { cn } from '@/lib/cn';
import { EmptyState } from './empty-state';

export interface Column<T> {
  readonly key: string;
  readonly header: string;
  readonly className?: string;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  readonly columns: readonly Column<T>[];
  readonly data: readonly T[] | null;
  readonly isLoading: boolean;
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
  readonly emptyAction?: React.ReactNode;
  readonly onRowClick?: (item: T) => void;
  readonly keyExtractor: (item: T) => string;
}

function SkeletonRows({ columns, rows = 5 }: { readonly columns: number; readonly rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  if (!isLoading && (!data || data.length === 0)) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {isLoading ? (
            <SkeletonRows columns={columns.length} />
          ) : (
            data?.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  'transition-colors hover:bg-gray-50',
                  onRowClick && 'cursor-pointer',
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-6 py-4 text-sm text-gray-900', col.className)}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
