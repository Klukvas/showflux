import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitesController } from './invites.controller.js';
import { InvitesService } from './invites.service.js';
import { Invite } from '../entities/invite.entity.js';
import { User } from '../entities/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Invite, User])],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
