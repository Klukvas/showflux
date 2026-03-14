import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { Listing } from '../entities/listing.entity.js';
import { Showing } from '../entities/showing.entity.js';
import { Offer } from '../entities/offer.entity.js';
import { User } from '../entities/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Listing, Showing, Offer, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
