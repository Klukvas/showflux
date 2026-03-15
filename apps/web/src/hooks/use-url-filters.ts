"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useUrlFilters<T extends object>(
  defaults: T,
): { filters: T; setFilters: (f: T) => void } {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultsRef = useRef(defaults);
  const entries = Object.entries(defaultsRef.current) as [string, unknown][];

  const filters = useMemo(() => {
    const result = { ...defaultsRef.current };
    const rec = result as Record<string, unknown>;
    for (const [key, defaultVal] of entries) {
      const value = searchParams.get(key);
      if (value !== null) {
        if (typeof defaultVal === "number") {
          const parsed = Number(value);
          rec[key] = Number.isFinite(parsed) ? parsed : defaultVal;
        } else {
          rec[key] = value;
        }
      }
    }
    return result;
  }, [searchParams, entries]);

  const setFilters = useCallback(
    (newFilters: T) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(newFilters)) {
        if (value !== undefined && value !== "" && value !== null) {
          params.set(key, String(value));
        }
      }
      // Remove default values to keep URL clean
      if (params.get("page") === "1") params.delete("page");
      const defaultLimit = (defaultsRef.current as Record<string, unknown>)
        .limit;
      if (defaultLimit != null && params.get("limit") === String(defaultLimit))
        params.delete("limit");

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, {
        scroll: false,
      });
    },
    [router],
  );

  return { filters, setFilters };
}
