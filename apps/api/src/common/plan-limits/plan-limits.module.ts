import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from '../../entities/workspace.entity.js';
import { Listing } from '../../entities/listing.entity.js';
import { Showing } from '../../entities/showing.entity.js';
import { User } from '../../entities/user.entity.js';
import { PlanLimitsGuard } from '../guards/plan-limits.guard.js';
import { ActiveSubscriptionGuard } from '../guards/active-subscription.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, Listing, Showing, User])],
  providers: [PlanLimitsGuard, ActiveSubscriptionGuard],
  exports: [PlanLimitsGuard, ActiveSubscriptionGuard],
})
export class PlanLimitsModule {}
