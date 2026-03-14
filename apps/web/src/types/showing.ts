import type { Listing } from './listing';
import type { User } from './user';

export type ShowingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Showing {
  readonly id: string;
  readonly workspaceId: string;
  readonly listingId: string;
  readonly listing?: Listing;
  readonly agentId: string;
  readonly agent?: User;
  readonly scheduledAt: string;
  readonly duration: number;
  readonly status: ShowingStatus;
  readonly feedback: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateShowingDto {
  readonly listingId: string;
  readonly scheduledAt: string;
  readonly duration?: number;
  readonly notes?: string;
}

export interface UpdateShowingDto {
  readonly scheduledAt?: string;
  readonly duration?: number;
  readonly status?: ShowingStatus;
  readonly feedback?: string;
  readonly notes?: string;
}

export interface ShowingFilters {
  readonly status?: ShowingStatus;
  readonly agentId?: string;
  readonly listingId?: string;
  readonly from?: string;
  readonly to?: string;
  readonly page?: number;
  readonly limit?: number;
}
