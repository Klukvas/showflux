import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
  FindOptionsWhere,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { Showing } from '../entities/showing.entity.js';
import { Listing } from '../entities/listing.entity.js';
import { CreateShowingDto } from './dto/create-showing.dto.js';
import { UpdateShowingDto } from './dto/update-showing.dto.js';
import { ShowingFilterDto } from './dto/showing-filter.dto.js';
import { PaginatedResult } from '../common/interfaces/paginated.interface.js';
import { ListingStatus } from '../common/enums/listing-status.enum.js';
import { ShowingStatus } from '../common/enums/showing-status.enum.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityAction } from '../common/enums/activity-action.enum.js';
import { DashboardService } from '../dashboard/dashboard.service.js';
import { Role } from '../common/enums/role.enum.js';

@Injectable()
export class ShowingsService {
  constructor(
    @InjectRepository(Showing)
    private readonly showingRepo: Repository<Showing>,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    private readonly dataSource: DataSource,
    private readonly activityService: ActivityService,
    private readonly dashboardService: DashboardService,
  ) {}

  async findAll(
    workspaceId: string,
    filters: ShowingFilterDto = {},
  ): Promise<PaginatedResult<Showing>> {
    const safePage = Math.max(1, filters.page ?? 1);
    const safeLimit = Math.min(Math.max(1, filters.limit ?? 50), 100);

    const where: FindOptionsWhere<Showing> = { workspaceId };
    if (filters.status) where.status = filters.status;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.listingId) where.listingId = filters.listingId;

    if (filters.from && filters.to) {
      where.scheduledAt = Between(new Date(filters.from), new Date(filters.to));
    } else if (filters.from) {
      where.scheduledAt = MoreThanOrEqual(new Date(filters.from));
    } else if (filters.to) {
      where.scheduledAt = LessThanOrEqual(new Date(filters.to));
    }

    const [data, total] = await this.showingRepo.findAndCount({
      where,
      relations: ['listing', 'agent'],
      order: { scheduledAt: 'ASC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  async findById(id: string, workspaceId: string): Promise<Showing> {
    const showing = await this.showingRepo.findOne({
      where: { id, workspaceId },
      relations: ['listing', 'agent'],
    });
    if (!showing) {
      throw new NotFoundException('Showing not found');
    }
    return showing;
  }

  async create(
    dto: CreateShowingDto,
    workspaceId: string,
    agentId: string,
  ): Promise<Showing> {
    const listing = await this.listingRepo.findOne({
      where: { id: dto.listingId, workspaceId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found in this workspace');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot schedule showing on a non-active listing',
      );
    }

    const scheduledAt = new Date(dto.scheduledAt);
    const duration = dto.duration ?? 30;
    const endAt = new Date(scheduledAt.getTime() + duration * 60_000);

    // Atomic check-and-insert inside a transaction
    const saved = await this.dataSource.transaction(async (manager) => {
      const overlap = await manager
        .createQueryBuilder(Showing, 's')
        .setLock('pessimistic_write')
        .where('s.listing_id = :listingId', { listingId: dto.listingId })
        .andWhere('s.workspace_id = :workspaceId', { workspaceId })
        .andWhere('s.status = :status', { status: ShowingStatus.SCHEDULED })
        .andWhere('s.scheduled_at < :endAt', { endAt })
        .andWhere(
          "s.scheduled_at + (s.duration * interval '1 minute') > :startAt",
          { startAt: scheduledAt },
        )
        .getOne();

      if (overlap) {
        throw new ConflictException(
          'Time slot conflicts with existing showing',
        );
      }

      const showing = manager.create(Showing, {
        ...dto,
        scheduledAt,
        workspaceId,
        agentId,
      });
      return manager.save(showing);
    });

    // Activity log outside transaction (best-effort)
    try {
      await this.activityService.log({
        workspaceId,
        userId: agentId,
        action: ActivityAction.SHOWING_SCHEDULED,
        entityType: 'showing',
        entityId: saved.id,
        metadata: { listingId: dto.listingId, scheduledAt: dto.scheduledAt },
      });
    } catch {
      // Activity logging is best-effort
    }

    this.dashboardService.invalidateSummary(workspaceId).catch(() => {});
    return saved;
  }

  async update(
    id: string,
    dto: UpdateShowingDto,
    workspaceId: string,
    userId: string,
    userRole: Role,
  ): Promise<Showing> {
    const showing = await this.findById(id, workspaceId);
    if (userRole === Role.AGENT && showing.agentId !== userId) {
      throw new ForbiddenException('You can only edit your own showings');
    }
    const { scheduledAt, ...rest } = dto;
    const updates: Partial<Showing> = { ...rest };
    if (scheduledAt) {
      updates.scheduledAt = new Date(scheduledAt);
    }
    const updated = this.showingRepo.create({ ...showing, ...updates });
    const saved = await this.showingRepo.save(updated);

    if (userId) {
      const action =
        dto.status === ShowingStatus.COMPLETED
          ? ActivityAction.SHOWING_COMPLETED
          : ActivityAction.SHOWING_UPDATED;
      try {
        await this.activityService.log({
          workspaceId,
          userId,
          action,
          entityType: 'showing',
          entityId: saved.id,
          metadata: { changes: Object.keys(dto) },
        });
      } catch {
        // Activity logging is best-effort
      }
    }
    this.dashboardService.invalidateSummary(workspaceId).catch(() => {});
    return saved;
  }

  async remove(id: string, workspaceId: string): Promise<void> {
    const showing = await this.findById(id, workspaceId);
    await this.showingRepo.remove(showing);
    this.dashboardService.invalidateSummary(workspaceId).catch(() => {});
  }
}
