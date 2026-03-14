import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsController } from './listings.controller.js';
import { ListingsService } from './listings.service.js';
import { Listing } from '../entities/listing.entity.js';
import { ActivityModule } from '../activity/activity.module.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing]),
    ActivityModule,
    DashboardModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
