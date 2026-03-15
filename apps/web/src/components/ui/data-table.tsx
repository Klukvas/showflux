"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "./empty-state";

export interface Column<T> {
  readonly key: string;
  readonly header: string;
  readonly className?: string;
  readonly sortable?: boolean;
  render: (item: T) => React.ReactNode;
  sortValue?: (item: T) => string | number;
}

interface SortState {
  readonly key: string;
  readonly direction: "asc" | "desc";
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

function SkeletonRows({
  columns,
  rows = 5,
}: {
  readonly columns: number;
  readonly rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={`skeleton-row-${i}`} className="border-b border-gray-100">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={`skeleton-col-${i}-${j}`} className="px-6 py-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function SortIcon({
  direction,
}: {
  readonly direction: "asc" | "desc" | null;
}) {
  if (!direction) {
    return (
      <svg
        className="ml-1 inline h-3 w-3 text-gray-400"
        viewBox="0 0 10 14"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5 0L9.33 5H0.67L5 0Z" />
        <path d="M5 14L0.67 9H9.33L5 14Z" />
      </svg>
    );
  }
  return (
    <svg
      className="ml-1 inline h-3 w-3 text-gray-700"
      viewBox="0 0 10 7"
      fill="currentColor"
      aria-hidden="true"
    >
      {direction === "asc" ? (
        <path d="M5 0L9.33 7H0.67L5 0Z" />
      ) : (
        <path d="M5 7L0.67 0H9.33L5 7Z" />
      )}
    </svg>
  );
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyTitle = "No data found",
  emptyDescription,
  emptyAction,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const sortedData = useMemo(() => {
    if (!data || !sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const getValue = col.sortValue;
    return [...data].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sort, columns]);

  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  }, []);

  const handleSortKeyDown = useCallback(
    (e: React.KeyboardEvent, key: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSort(key);
      }
    },
    [handleSort],
  );

  const getAriaSortValue = useCallback(
    (colKey: string, sortable?: boolean): "ascending" | "descending" | "none" | undefined => {
      if (!sortable) return undefined;
      if (sort?.key === colKey) {
        return sort.direction === "asc" ? "ascending" : "descending";
      }
      return "none";
    },
    [sort],
  );

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
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
                  "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500",
                  col.sortable &&
                    "cursor-pointer select-none hover:text-gray-700",
                  col.className,
                )}
                aria-sort={getAriaSortValue(col.key, col.sortable)}
                tabIndex={col.sortable ? 0 : undefined}
                role={col.sortable ? "columnheader" : undefined}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                onKeyDown={
                  col.sortable
                    ? (e) => handleSortKeyDown(e, col.key)
                    : undefined
                }
              >
                {col.header}
                {col.sortable && (
                  <SortIcon
                    direction={sort?.key === col.key ? sort.direction : null}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white fade-in">
          {isLoading ? (
            <SkeletonRows columns={columns.length} />
          ) : (
            sortedData?.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  "transition-colors hover:bg-gray-50",
                  onRowClick && "cursor-pointer",
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-6 py-4 text-sm text-gray-900",
                      col.className,
                    )}
                  >
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
