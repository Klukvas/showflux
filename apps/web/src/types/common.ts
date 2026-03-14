export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface ApiError {
  readonly statusCode: number;
  readonly message: string | string[];
  readonly error?: string;
}

export type Role = 'broker' | 'agent';
export type Plan = 'solo' | 'team' | 'agency';
