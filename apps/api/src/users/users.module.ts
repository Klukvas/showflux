import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UsersGdprService } from './users-gdpr.service.js';
import { User } from '../entities/user.entity.js';
import { Workspace } from '../entities/workspace.entity.js';
import { Listing } from '../entities/listing.entity.js';
import { Showing } from '../entities/showing.entity.js';
import { Offer } from '../entities/offer.entity.js';
import { Activity } from '../entities/activity.entity.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Workspace, Listing, Showing, Offer, Activity]),
    DashboardModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersGdprService],
  exports: [UsersService],
})
export class UsersModule {}
