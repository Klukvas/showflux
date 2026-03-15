import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitesController } from './invites.controller.js';
import { InvitesService } from './invites.service.js';
import { Invite } from '../entities/invite.entity.js';
import { User } from '../entities/user.entity.js';
import { Workspace } from '../entities/workspace.entity.js';
import { ActivityModule } from '../activity/activity.module.js';
import { EmailModule } from '../common/email/email.module.js';
import { PlanLimitsModule } from '../common/plan-limits/plan-limits.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite, User, Workspace]),
    ActivityModule,
    EmailModule,
    PlanLimitsModule,
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
