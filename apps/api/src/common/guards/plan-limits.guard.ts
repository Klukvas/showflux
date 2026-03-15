import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../../entities/workspace.entity.js';
import { Listing } from '../../entities/listing.entity.js';
import { Showing } from '../../entities/showing.entity.js';
import { User } from '../../entities/user.entity.js';
import {
  PLAN_LIMITS,
  type PlanLimitResource,
} from '../constants/plan-limits.constants.js';
import { PLAN_LIMIT_RESOURCE_KEY } from '../decorators/plan-limit-resource.decorator.js';

@Injectable()
export class PlanLimitsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
    @InjectRepository(Showing)
    private readonly showingRepo: Repository<Showing>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.get<PlanLimitResource | undefined>(
      PLAN_LIMIT_RESOURCE_KEY,
      ctx.getHandler(),
    );

    if (!resource) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest();
    const workspaceId: string | undefined = request.user?.workspaceId;

    if (!workspaceId) {
      return false;
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      select: ['id', 'plan'],
    });

    if (!workspace) {
      return false;
    }

    const limits = PLAN_LIMITS[workspace.plan];
    const maxAllowed = limits[resource];

    if (maxAllowed === Infinity) {
      return true;
    }

    const currentCount = await this.countResource(resource, workspaceId);

    if (currentCount >= maxAllowed) {
      throw new ForbiddenException(
        `Plan limit reached: your ${workspace.plan} plan allows ${maxAllowed} ${resource}. Please upgrade your plan.`,
      );
    }

    return true;
  }

  private async countResource(
    resource: PlanLimitResource,
    workspaceId: string,
  ): Promise<number> {
    switch (resource) {
      case 'listings':
        return this.listingRepo.count({ where: { workspaceId } });
      case 'users':
        return this.userRepo.count({
          where: { workspaceId, isActive: true },
        });
      case 'showings': {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return this.showingRepo
          .createQueryBuilder('s')
          .where('s.workspace_id = :workspaceId', { workspaceId })
          .andWhere('s.created_at >= :startOfMonth', { startOfMonth })
          .getCount();
      }
    }
  }
}
