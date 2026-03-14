'use client';

import { useState, useCallback } from 'react';
import type { ValidationResult } from '@/lib/validators';

type ValidatorFn = (value: string, allValues: Record<string, string>) => ValidationResult;

interface UseFormOptions<T extends Record<string, string>> {
  readonly initialValues: T;
  readonly validators?: Partial<Record<keyof T, ValidatorFn>>;
  readonly onSubmit: (values: T) => Promise<void>;
}

interface UseFormReturn<T extends Record<string, string>> {
  readonly values: T;
  readonly errors: Partial<Record<keyof T, string>>;
  readonly isSubmitting: boolean;
  readonly serverError: string | null;
  setValue: (field: keyof T, value: string) => void;
  setServerError: (error: string | null) => void;
  setFieldError: (field: keyof T, error: string) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
}

export function useForm<T extends Record<string, string>>(
  options: UseFormOptions<T>,
): UseFormReturn<T> {
  const { initialValues, validators, onSubmit } = options;
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateField = useCallback(
    (field: keyof T, val: string, allVals: T): string | null => {
      const validator = validators?.[field];
      if (!validator) return null;
      return validator(val, allVals);
    },
    [validators],
  );

  const setValue = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest as Partial<Record<keyof T, string>>;
    });
    setServerError(null);
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const handleBlur = useCallback(
    (field: keyof T) => {
      const error = validateField(field, values[field], values);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [validateField, values],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      const newErrors: Partial<Record<keyof T, string>> = {};
      let hasErrors = false;
      for (const field of Object.keys(values) as (keyof T)[]) {
        const error = validateField(field, values[field], values);
        if (error) {
          newErrors[field] = error;
          hasErrors = true;
        }
      }

      if (hasErrors) {
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setServerError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateField, onSubmit],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setServerError(null);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    serverError,
    setValue,
    setServerError,
    setFieldError,
    handleBlur,
    handleSubmit,
    reset,
  };
}
