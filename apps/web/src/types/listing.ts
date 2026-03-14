import type { User } from './user';

export type ListingStatus = 'active' | 'pending' | 'sold' | 'withdrawn';

export interface Listing {
  readonly id: string;
  readonly workspaceId: string;
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly zip: string;
  readonly mlsNumber: string | null;
  readonly price: number;
  readonly bedrooms: number | null;
  readonly bathrooms: number | null;
  readonly sqft: number | null;
  readonly status: ListingStatus;
  readonly listingAgentId: string;
  readonly listingAgent?: User;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateListingDto {
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly zip: string;
  readonly mlsNumber?: string;
  readonly price: number;
  readonly bedrooms?: number;
  readonly bathrooms?: number;
  readonly sqft?: number;
  readonly status?: ListingStatus;
  readonly notes?: string;
}

export interface UpdateListingDto extends Partial<CreateListingDto> {}

export interface ListingFilters {
  readonly status?: ListingStatus;
  readonly agentId?: string;
  readonly city?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly page?: number;
  readonly limit?: number;
}
