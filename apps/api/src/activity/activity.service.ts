import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity.js';
import { ActivityAction } from '../common/enums/activity-action.enum.js';
import { PaginatedResult } from '../common/interfaces/paginated.interface.js';

interface LogParams {
  workspaceId: string;
  userId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  async log(params: LogParams): Promise<void> {
    const activity = this.activityRepo.create({
      workspaceId: params.workspaceId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ?? null,
    });
    await this.activityRepo.save(activity);
  }

  async findAll(
    workspaceId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<Activity>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const [data, total] = await this.activityRepo.findAndCount({
      where: { workspaceId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }
}
