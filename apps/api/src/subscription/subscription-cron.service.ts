import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Between, Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity.js';
import { User } from '../entities/user.entity.js';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { EmailService } from '../common/email/email.service.js';
import { MetricsService } from '../common/metrics/metrics.service.js';
import { RedisCacheService } from '../common/cache/redis-cache.service.js';

const TRIAL_REMINDER_TTL = 60 * 60 * 24 * 4; // 4 days in seconds

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
    private readonly metricsService: MetricsService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  /** Cancel expired trials every 6 hours */
  @Cron('0 */6 * * *')
  async handleExpiredTrials(): Promise<void> {
    const now = new Date();

    const expired = await this.workspaceRepo.find({
      where: {
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt: LessThan(now),
      },
    });

    this.logger.log(`Found ${expired.length} expired trial(s)`);

    for (const ws of expired) {
      await this.workspaceRepo.update(ws.id, {
        subscriptionStatus: SubscriptionStatus.CANCELED,
      });

      this.metricsService.trackEvent('trial.expired', {
        workspaceId: ws.id,
      });

      const broker = await this.findBroker(ws.id);
      if (broker) {
        this.emailService
          .sendTrialExpired(broker.email, ws.name)
          .catch((err) =>
            this.logger.warn(
              `Failed to send trial-expired email: ${(err as Error).message}`,
            ),
          );
      }
    }
  }

  /** Send trial-ending-soon reminders daily at 9 AM */
  @Cron('0 9 * * *')
  async handleTrialReminders(): Promise<void> {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiringTrials = await this.workspaceRepo.find({
      where: {
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt: Between(now, threeDaysLater),
      },
    });

    this.logger.log(
      `Found ${expiringTrials.length} trial(s) expiring within 3 days`,
    );

    for (const ws of expiringTrials) {
      const cacheKey = `trial_reminder:${ws.id}`;
      const alreadySent = await this.redisCacheService.get(cacheKey);
      if (alreadySent) continue;

      const daysLeft = Math.ceil(
        (ws.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const broker = await this.findBroker(ws.id);
      if (broker) {
        this.emailService
          .sendTrialEndingSoon(broker.email, ws.name, daysLeft)
          .catch((err) =>
            this.logger.warn(
              `Failed to send trial reminder email: ${(err as Error).message}`,
            ),
          );
      }

      await this.redisCacheService.set(cacheKey, '1', TRIAL_REMINDER_TTL);
    }
  }

  /** Send payment failure reminders daily at 9 AM */
  @Cron('0 9 * * *')
  async handlePaymentFailureReminders(): Promise<void> {
    const pastDue = await this.workspaceRepo.find({
      where: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
    });

    this.logger.log(`Found ${pastDue.length} past-due workspace(s)`);

    for (const ws of pastDue) {
      const broker = await this.findBroker(ws.id);
      if (broker) {
        this.emailService
          .sendPaymentFailed(broker.email, ws.name)
          .catch((err) =>
            this.logger.warn(
              `Failed to send payment-failed email: ${(err as Error).message}`,
            ),
          );
      }
    }
  }

  private async findBroker(workspaceId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { workspaceId, role: Role.BROKER, isActive: true },
    });
  }
}
