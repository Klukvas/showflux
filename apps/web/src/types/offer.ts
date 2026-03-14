import type { Listing } from './listing';
import type { User } from './user';

export type OfferStatus = 'submitted' | 'accepted' | 'rejected' | 'countered' | 'withdrawn' | 'expired';

export interface Offer {
  readonly id: string;
  readonly workspaceId: string;
  readonly listingId: string;
  readonly listing?: Listing;
  readonly agentId: string;
  readonly agent?: User;
  readonly buyerName: string;
  readonly offerAmount: number;
  readonly status: OfferStatus;
  readonly submittedAt: string;
  readonly expirationDate: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateOfferDto {
  readonly listingId: string;
  readonly buyerName: string;
  readonly offerAmount: number;
  readonly expirationDate?: string;
  readonly notes?: string;
}

export interface UpdateOfferDto {
  readonly buyerName?: string;
  readonly offerAmount?: number;
  readonly status?: OfferStatus;
  readonly expirationDate?: string;
  readonly notes?: string;
}

export interface OfferFilters {
  readonly status?: OfferStatus;
  readonly agentId?: string;
  readonly listingId?: string;
  readonly page?: number;
  readonly limit?: number;
}
