import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { User } from '../entities/user.entity.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), DashboardModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
