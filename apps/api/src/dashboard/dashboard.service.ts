import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisCacheService } from '../common/cache/redis-cache.service.js';
import {
  CACHE_KEY_PREFIX,
  CACHE_TTL,
} from '../common/cache/redis-cache.constants.js';
import { Listing } from '../entities/listing.entity.js';
import { Showing } from '../entities/showing.entity.js';
import { Offer } from '../entities/offer.entity.js';
import { User } from '../entities/user.entity.js';
import { ListingStatus } from '../common/enums/listing-status.enum.js';
import { ShowingStatus } from '../common/enums/showing-status.enum.js';
import { OfferStatus } from '../common/enums/offer-status.enum.js';

export interface DashboardSummary {
  listings: { total: number; active: number; pending: number; sold: number };
  showings: { total: number; scheduled: number; completed: number };
  offers: { total: number; submitted: number; accepted: number };
  team: { total: number; active: number };
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    @InjectRepository(Showing)
    private readonly showingRepo: Repository<Showing>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async getSummary(workspaceId: string): Promise<DashboardSummary> {
    const cacheKey = `${CACHE_KEY_PREFIX.DASHBOARD_SUMMARY}:${workspaceId}`;
    const cached = await this.redisCacheService.get<DashboardSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    const [listings, showings, offers, team] = await Promise.all([
      this.getListingStats(workspaceId),
      this.getShowingStats(workspaceId),
      this.getOfferStats(workspaceId),
      this.getTeamStats(workspaceId),
    ]);

    const summary = { listings, showings, offers, team };
    await this.redisCacheService.set(cacheKey, summary, CACHE_TTL.DASHBOARD);
    return summary;
  }

  async invalidateSummary(workspaceId: string): Promise<void> {
    await this.redisCacheService
      .del(`${CACHE_KEY_PREFIX.DASHBOARD_SUMMARY}:${workspaceId}`)
      .catch(() => {});
  }

  private async getListingStats(workspaceId: string) {
    const [total, active, pending, sold] = await Promise.all([
      this.listingRepo.count({ where: { workspaceId } }),
      this.listingRepo.count({
        where: { workspaceId, status: ListingStatus.ACTIVE },
      }),
      this.listingRepo.count({
        where: { workspaceId, status: ListingStatus.PENDING },
      }),
      this.listingRepo.count({
        where: { workspaceId, status: ListingStatus.SOLD },
      }),
    ]);
    return { total, active, pending, sold };
  }

  private async getShowingStats(workspaceId: string) {
    const [total, scheduled, completed] = await Promise.all([
      this.showingRepo.count({ where: { workspaceId } }),
      this.showingRepo.count({
        where: { workspaceId, status: ShowingStatus.SCHEDULED },
      }),
      this.showingRepo.count({
        where: { workspaceId, status: ShowingStatus.COMPLETED },
      }),
    ]);

    return { total, scheduled, completed };
  }

  private async getOfferStats(workspaceId: string) {
    const [total, submitted, accepted] = await Promise.all([
      this.offerRepo.count({ where: { workspaceId } }),
      this.offerRepo.count({
        where: { workspaceId, status: OfferStatus.SUBMITTED },
      }),
      this.offerRepo.count({
        where: { workspaceId, status: OfferStatus.ACCEPTED },
      }),
    ]);
    return { total, submitted, accepted };
  }

  private async getTeamStats(workspaceId: string) {
    const [total, active] = await Promise.all([
      this.userRepo.count({ where: { workspaceId } }),
      this.userRepo.count({ where: { workspaceId, isActive: true } }),
    ]);
    return { total, active };
  }
}
