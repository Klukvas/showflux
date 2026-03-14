import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './offers.controller.js';
import { OffersService } from './offers.service.js';
import { Offer } from '../entities/offer.entity.js';
import { Listing } from '../entities/listing.entity.js';
import { ActivityModule } from '../activity/activity.module.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer, Listing]),
    ActivityModule,
    DashboardModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
