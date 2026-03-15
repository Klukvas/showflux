import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from '../entities/workspace.entity.js';
import { User } from '../entities/user.entity.js';
import { SubscriptionService } from './subscription.service.js';
import { SubscriptionController } from './subscription.controller.js';
import { WebhookController } from './webhook.controller.js';
import { SubscriptionCronService } from './subscription-cron.service.js';
import { EmailModule } from '../common/email/email.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, User]), EmailModule],
  controllers: [SubscriptionController, WebhookController],
  providers: [SubscriptionService, SubscriptionCronService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
