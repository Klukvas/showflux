import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  ILike,
} from 'typeorm';
import { Listing } from '../entities/listing.entity.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { UpdateListingDto } from './dto/update-listing.dto.js';
import { ListingFilterDto } from './dto/listing-filter.dto.js';
import { PaginatedResult } from '../common/interfaces/paginated.interface.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityAction } from '../common/enums/activity-action.enum.js';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    private readonly activityService: ActivityService,
  ) {}

  async findAll(
    workspaceId: string,
    filters: ListingFilterDto = {},
  ): Promise<PaginatedResult<Listing>> {
    const safePage = Math.max(1, filters.page ?? 1);
    const safeLimit = Math.min(Math.max(1, filters.limit ?? 50), 100);

    const where: FindOptionsWhere<Listing> = { workspaceId };
    if (filters.status) where.status = filters.status;
    if (filters.agentId) where.listingAgentId = filters.agentId;
    if (filters.city) where.city = ILike(filters.city);

    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      where.price = Between(filters.minPrice, filters.maxPrice);
    } else if (filters.minPrice !== undefined) {
      where.price = MoreThanOrEqual(filters.minPrice);
    } else if (filters.maxPrice !== undefined) {
      where.price = LessThanOrEqual(filters.maxPrice);
    }

    const [data, total] = await this.listingRepo.findAndCount({
      where,
      relations: ['listingAgent'],
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  async findById(id: string, workspaceId: string): Promise<Listing> {
    const listing = await this.listingRepo.findOne({
      where: { id, workspaceId },
      relations: ['listingAgent'],
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async create(
    dto: CreateListingDto,
    workspaceId: string,
    agentId: string,
  ): Promise<Listing> {
    const listing = this.listingRepo.create({
      ...dto,
      workspaceId,
      listingAgentId: agentId,
    });
    const saved = await this.listingRepo.save(listing);
    try {
      await this.activityService.log({
        workspaceId,
        userId: agentId,
        action: ActivityAction.LISTING_CREATED,
        entityType: 'listing',
        entityId: saved.id,
        metadata: { address: saved.address, price: saved.price },
      });
    } catch {
      // Activity logging is best-effort
    }
    return saved;
  }

  async update(
    id: string,
    dto: UpdateListingDto,
    workspaceId: string,
    userId?: string,
  ): Promise<Listing> {
    const listing = await this.findById(id, workspaceId);
    const updated = this.listingRepo.create({ ...listing, ...dto });
    const saved = await this.listingRepo.save(updated);
    if (userId) {
      try {
        await this.activityService.log({
          workspaceId,
          userId,
          action: ActivityAction.LISTING_UPDATED,
          entityType: 'listing',
          entityId: saved.id,
          metadata: { changes: Object.keys(dto) },
        });
      } catch {
        // Activity logging is best-effort
      }
    }
    return saved;
  }

  async remove(
    id: string,
    workspaceId: string,
    userId?: string,
  ): Promise<void> {
    const listing = await this.findById(id, workspaceId);
    await this.listingRepo.remove(listing);
    if (userId) {
      try {
        await this.activityService.log({
          workspaceId,
          userId,
          action: ActivityAction.LISTING_DELETED,
          entityType: 'listing',
          entityId: id,
          metadata: { address: listing.address },
        });
      } catch {
        // Activity logging is best-effort
      }
    }
  }
}
