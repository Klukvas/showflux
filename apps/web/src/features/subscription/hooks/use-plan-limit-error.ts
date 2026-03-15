"use client";

import { useState, useCallback } from "react";
import { ApiClientError } from "@/lib/api-client";

export function usePlanLimitError() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const handleError = useCallback((error: unknown): boolean => {
    if (
      error instanceof ApiClientError &&
      error.statusCode === 403 &&
      typeof error.body.message === "string" &&
      error.body.message.toLowerCase().includes("plan limit")
    ) {
      setMessage(error.body.message);
      setIsOpen(true);
      return true;
    }
    return false;
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setMessage(undefined);
  }, []);

  return { isOpen, message, handleError, close };
}
