import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { Offer } from '../entities/offer.entity.js';
import { Listing } from '../entities/listing.entity.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { OfferFilterDto } from './dto/offer-filter.dto.js';
import { PaginatedResult } from '../common/interfaces/paginated.interface.js';
import { ListingStatus } from '../common/enums/listing-status.enum.js';
import { OfferStatus } from '../common/enums/offer-status.enum.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityAction } from '../common/enums/activity-action.enum.js';
import { DashboardService } from '../dashboard/dashboard.service.js';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    private readonly dataSource: DataSource,
    private readonly activityService: ActivityService,
    private readonly dashboardService: DashboardService,
  ) {}

  async findAll(
    workspaceId: string,
    filters: OfferFilterDto = {},
  ): Promise<PaginatedResult<Offer>> {
    const safePage = Math.max(1, filters.page ?? 1);
    const safeLimit = Math.min(Math.max(1, filters.limit ?? 50), 100);

    const where: FindOptionsWhere<Offer> = { workspaceId };
    if (filters.status) where.status = filters.status;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.listingId) where.listingId = filters.listingId;

    const [data, total] = await this.offerRepo.findAndCount({
      where,
      relations: ['listing', 'agent'],
      order: { submittedAt: 'DESC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  async findById(id: string, workspaceId: string): Promise<Offer> {
    const offer = await this.offerRepo.findOne({
      where: { id, workspaceId },
      relations: ['listing', 'agent'],
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }

  async create(
    dto: CreateOfferDto,
    workspaceId: string,
    agentId: string,
  ): Promise<Offer> {
    const listing = await this.listingRepo.findOne({
      where: { id: dto.listingId, workspaceId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found in this workspace');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot submit offer on a non-active listing',
      );
    }

    const offer = this.offerRepo.create({
      ...dto,
      submittedAt: new Date(),
      expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
      workspaceId,
      agentId,
    });
    const saved = await this.offerRepo.save(offer);

    try {
      await this.activityService.log({
        workspaceId,
        userId: agentId,
        action: ActivityAction.OFFER_SUBMITTED,
        entityType: 'offer',
        entityId: saved.id,
        metadata: { listingId: dto.listingId, amount: dto.offerAmount },
      });
    } catch {
      // Activity logging is best-effort
    }

    this.dashboardService.invalidateSummary(workspaceId).catch(() => {});
    return saved;
  }

  async update(
    id: string,
    dto: UpdateOfferDto,
    workspaceId: string,
    userId?: string,
  ): Promise<Offer> {
    if (dto.status === OfferStatus.ACCEPTED) {
      return this.acceptOffer(id, workspaceId, dto, userId);
    }

    const offer = await this.findById(id, workspaceId);
    const { expirationDate, ...rest } = dto;
    const updates: Partial<Offer> = { ...rest };
    if (expirationDate) {
      updates.expirationDate = new Date(expirationDate);
    }
    const updated = this.offerRepo.create({ ...offer, ...updates });
    const saved = await this.offerRepo.save(updated);

    if (userId && dto.status) {
      const action =
        dto.status === OfferStatus.REJECTED
          ? ActivityAction.OFFER_REJECTED
          : ActivityAction.OFFER_UPDATED;
      try {
        await this.activityService.log({
          workspaceId,
          userId,
          action,
          entityType: 'offer',
          entityId: saved.id,
          metadata: { status: dto.status },
        });
      } catch {
        // Activity logging is best-effort
      }
    }
    this.dashboardService.invalidateSummary(workspaceId).catch(() => {});
    return saved;
  }

  async remove(id: string, workspaceId: string): Promise<void> {
    const offer = await this.findById(id, workspaceId);
    await this.offerRepo.remove(offer);
    this.dashboardService.invalidateSummary(workspaceId).catch(() => {});
  }

  private async acceptOffer(
    id: string,
    workspaceId: string,
    dto: UpdateOfferDto,
    userId?: string,
  ): Promise<Offer> {
    const saved = await this.dataSource.transaction(async (manager) => {
      const offer = await manager.findOne(Offer, {
        where: { id, workspaceId },
        relations: ['listing', 'agent'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!offer) {
        throw new NotFoundException('Offer not found');
      }

      const existingAccepted = await manager.findOne(Offer, {
        where: {
          listingId: offer.listingId,
          workspaceId,
          status: OfferStatus.ACCEPTED,
        },
      });
      if (existingAccepted) {
        throw new ConflictException(
          'Another offer has already been accepted on this listing',
        );
      }

      const { expirationDate, ...rest } = dto;
      const updates: Partial<Offer> = { ...rest };
      if (expirationDate) {
        updates.expirationDate = new Date(expirationDate);
      }
      const updated = manager.create(Offer, { ...offer, ...updates });
      return manager.save(updated);
    });

    // Activity log outside transaction (best-effort)
    if (userId) {
      try {
        await this.activityService.log({
          workspaceId,
          userId,
          action: ActivityAction.OFFER_ACCEPTED,
          entityType: 'offer',
          entityId: saved.id,
          metadata: { listingId: saved.listingId, amount: saved.offerAmount },
        });
      } catch {
        // Activity logging is best-effort
      }
    }

    this.dashboardService.invalidateSummary(workspaceId).catch(() => {});
    return saved;
  }
}
