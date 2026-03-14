"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api-client";

interface UseFetchResult<T> {
  readonly data: T | null;
  readonly error: string | null;
  readonly isLoading: boolean;
  refetch: () => void;
}

export function useFetch<T>(path: string | null): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!path);
  const requestId = useRef(0);

  const fetchData = useCallback(async () => {
    if (!path) return;
    const currentId = ++requestId.current;
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await api.get<T>(path);
      if (currentId === requestId.current) {
        setData(result);
      }
    } catch (err: unknown) {
      if (currentId === requestId.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      }
    } finally {
      if (currentId === requestId.current) {
        setIsLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}
