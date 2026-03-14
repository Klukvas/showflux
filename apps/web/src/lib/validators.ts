import { PASSWORD_REGEX, PASSWORD_REQUIREMENTS } from './constants';

export type ValidationResult = string | null;
export type ValidatorFn = (value: string) => ValidationResult;

export function required(label: string): ValidatorFn {
  return (value: string) => (value.trim() ? null : `${label} is required`);
}

export function email(value: string): ValidationResult {
  if (!value.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? null : 'Invalid email address';
}

export function minLength(label: string, min: number): ValidatorFn {
  return (value: string) =>
    value.length >= min ? null : `${label} must be at least ${min} characters`;
}

export function maxLength(label: string, max: number): ValidatorFn {
  return (value: string) =>
    value.length <= max ? null : `${label} must be at most ${max} characters`;
}

export function strongPassword(value: string): ValidationResult {
  if (!value) return 'Password is required';
  return PASSWORD_REGEX.test(value) ? null : PASSWORD_REQUIREMENTS;
}

export function matchesField(fieldName: string, label: string): (value: string, allValues: Record<string, string>) => ValidationResult {
  return (value: string, allValues: Record<string, string>) =>
    value === allValues[fieldName] ? null : `${label} must match`;
}

export function positiveNumber(label: string): ValidatorFn {
  return (value: string) => {
    const num = Number(value);
    return !isNaN(num) && num > 0 ? null : `${label} must be a positive number`;
  };
}

export function compose(...validators: ValidatorFn[]): ValidatorFn {
  return (value: string) => {
    for (const validator of validators) {
      const result = validator(value);
      if (result) return result;
    }
    return null;
  };
}
