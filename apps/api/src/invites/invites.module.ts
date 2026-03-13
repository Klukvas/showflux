import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitesController } from './invites.controller.js';
import { InvitesService } from './invites.service.js';
import { Invite } from '../entities/invite.entity.js';
import { User } from '../entities/user.entity.js';
import { ActivityModule } from '../activity/activity.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Invite, User]), ActivityModule],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
