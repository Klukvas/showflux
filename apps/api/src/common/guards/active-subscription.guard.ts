import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../../entities/workspace.entity.js';
import { SubscriptionStatus } from '../enums/subscription-status.enum.js';

const ALLOWED_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
]);

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const workspaceId: string | undefined = request.user?.workspaceId;

    if (!workspaceId) {
      return false;
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      select: ['id', 'subscriptionStatus'],
    });

    if (!workspace) {
      return false;
    }

    if (!ALLOWED_STATUSES.has(workspace.subscriptionStatus)) {
      throw new ForbiddenException(
        'Your subscription is inactive. Please renew to continue.',
      );
    }

    return true;
  }
}
