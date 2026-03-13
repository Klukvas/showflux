import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowingsController } from './showings.controller.js';
import { ShowingsService } from './showings.service.js';
import { Showing } from '../entities/showing.entity.js';
import { Listing } from '../entities/listing.entity.js';
import { ActivityModule } from '../activity/activity.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Showing, Listing]), ActivityModule],
  controllers: [ShowingsController],
  providers: [ShowingsService],
  exports: [ShowingsService],
})
export class ShowingsModule {}
