import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { Workspace } from '../entities/workspace.entity.js';
import { User } from '../entities/user.entity.js';
import { Plan } from '../common/enums/plan.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum.js';
import { EmailService } from '../common/email/email.service.js';
import { MetricsService } from '../common/metrics/metrics.service.js';
import type { EventEntity, EventName } from '@paddle/paddle-node-sdk';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly paddle: Paddle;
  private readonly priceIds: Readonly<Record<Plan, string>>;
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly metricsService: MetricsService,
  ) {
    const apiKey = this.configService.getOrThrow<string>('PADDLE_API_KEY');
    const environment =
      this.configService.get<string>('PADDLE_ENVIRONMENT', 'sandbox') ===
      'production'
        ? Environment.production
        : Environment.sandbox;

    this.paddle = new Paddle(apiKey, { environment });
    this.webhookSecret = this.configService.getOrThrow<string>(
      'PADDLE_WEBHOOK_SECRET',
    );

    this.priceIds = {
      [Plan.SOLO]: this.configService.getOrThrow<string>('PADDLE_PRICE_SOLO'),
      [Plan.TEAM]: this.configService.getOrThrow<string>('PADDLE_PRICE_TEAM'),
      [Plan.AGENCY]: this.configService.getOrThrow<string>(
        'PADDLE_PRICE_AGENCY',
      ),
    };
  }

  async getSubscriptionStatus(workspaceId: string) {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      select: [
        'id',
        'plan',
        'subscriptionStatus',
        'currentPeriodEnd',
        'trialEndsAt',
        'paddleSubscriptionId',
      ],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return {
      plan: workspace.plan,
      status: workspace.subscriptionStatus,
      currentPeriodEnd: workspace.currentPeriodEnd,
      trialEndsAt: workspace.trialEndsAt,
      hasSubscription: workspace.paddleSubscriptionId !== null,
    };
  }

  async createCheckoutSession(workspaceId: string, plan: Plan) {
    const workspace = await this.workspaceRepo.findOneOrFail({
      where: { id: workspaceId },
    });

    const priceId = this.priceIds[plan];

    const transaction = await this.paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { workspaceId },
      ...(workspace.paddleCustomerId
        ? { customerId: workspace.paddleCustomerId }
        : {}),
    });

    this.metricsService.trackEvent('subscription.checkout', {
      workspaceId,
      plan,
    });

    return { transactionId: transaction.id };
  }

  async cancelSubscription(workspaceId: string) {
    const workspace = await this.workspaceRepo.findOneOrFail({
      where: { id: workspaceId },
    });

    if (!workspace.paddleSubscriptionId) {
      throw new BadRequestException('No active subscription to cancel');
    }

    await this.paddle.subscriptions.cancel(workspace.paddleSubscriptionId, {
      effectiveFrom: 'next_billing_period',
    });

    return { message: 'Subscription will cancel at end of billing period' };
  }

  async updatePlan(workspaceId: string, plan: Plan) {
    const workspace = await this.workspaceRepo.findOneOrFail({
      where: { id: workspaceId },
    });

    if (!workspace.paddleSubscriptionId) {
      throw new BadRequestException('No active subscription to update');
    }

    const priceId = this.priceIds[plan];

    await this.paddle.subscriptions.update(workspace.paddleSubscriptionId, {
      items: [{ priceId, quantity: 1 }],
      prorationBillingMode: 'prorated_immediately',
    });

    return { message: 'Plan update initiated' };
  }

  async handleWebhookEvent(rawBody: string, signature: string): Promise<void> {
    let event: EventEntity;

    try {
      event = await this.paddle.webhooks.unmarshal(
        rawBody,
        this.webhookSecret,
        signature,
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventName = event.eventType as string;

    this.logger.log(`Processing Paddle webhook: ${eventName}`);

    if (!eventName.startsWith('subscription.')) {
      return;
    }

    await this.processSubscriptionEvent(event);
  }

  private async processSubscriptionEvent(event: EventEntity): Promise<void> {
    const data = event.data as {
      id: string;
      status: string;
      customerId: string;
      customData?: { workspaceId?: string };
      currentBillingPeriod?: { endsAt?: string } | null;
      items?: Array<{ price?: { id?: string } }>;
    };

    const workspaceId = data.customData?.workspaceId;
    if (!workspaceId) {
      this.logger.warn('Webhook event missing workspaceId in customData');
      return;
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      this.logger.warn(`Workspace ${workspaceId} not found for webhook event`);
      return;
    }

    const subscriptionStatus = this.mapPaddleStatus(data.status);
    const plan = this.mapPriceIdToPlan(data.items?.[0]?.price?.id);

    await this.workspaceRepo.update(workspaceId, {
      paddleCustomerId: data.customerId,
      paddleSubscriptionId: data.id,
      subscriptionStatus,
      ...(plan ? { plan } : {}),
      ...(data.currentBillingPeriod?.endsAt
        ? { currentPeriodEnd: new Date(data.currentBillingPeriod.endsAt) }
        : {}),
    });

    this.logger.log(
      `Updated workspace ${workspaceId}: status=${subscriptionStatus}`,
    );

    if (subscriptionStatus === SubscriptionStatus.CANCELED) {
      this.metricsService.trackEvent('subscription.canceled', { workspaceId });

      const broker = await this.userRepo.findOne({
        where: { workspaceId, role: Role.BROKER, isActive: true },
      });
      if (broker) {
        this.emailService
          .sendSubscriptionCanceled(broker.email, workspace.name)
          .catch((err) =>
            this.logger.warn(
              `Subscription canceled email failed: ${(err as Error).message}`,
            ),
          );
      }
    }
  }

  private mapPaddleStatus(status: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      trialing: SubscriptionStatus.TRIALING,
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      paused: SubscriptionStatus.PAUSED,
      canceled: SubscriptionStatus.CANCELED,
    };
    return statusMap[status] ?? SubscriptionStatus.ACTIVE;
  }

  private mapPriceIdToPlan(priceId?: string): Plan | null {
    if (!priceId) return null;

    const entry = Object.entries(this.priceIds).find(
      ([, id]) => id === priceId,
    );
    return entry ? (entry[0] as Plan) : null;
  }
}
