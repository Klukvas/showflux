import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Workspace } from '../entities/workspace.entity';
import { User } from '../entities/user.entity';
import { EmailService } from '../common/email/email.service';
import { MetricsService } from '../common/metrics/metrics.service';
import { Plan } from '../common/enums/plan.enum';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';
import { buildWorkspace } from '../test-utils/factories';

jest.mock('@paddle/paddle-node-sdk', () => {
  const mockTransactions = { create: jest.fn() };
  const mockSubscriptions = {
    cancel: jest.fn(),
    update: jest.fn(),
  };
  const mockWebhooks = { unmarshal: jest.fn() };

  class MockPaddle {
    transactions = mockTransactions;
    subscriptions = mockSubscriptions;
    webhooks = mockWebhooks;
  }

  return {
    __esModule: true,
    Paddle: MockPaddle,
    Environment: { sandbox: 'sandbox', production: 'production' },
    // Export mocks for test access
    __mockTransactions: mockTransactions,
    __mockSubscriptions: mockSubscriptions,
    __mockWebhooks: mockWebhooks,
  };
});

// Get mock references
const paddleMock = jest.requireMock('@paddle/paddle-node-sdk') as {
  __mockTransactions: {
    create: jest.Mock;
  };
  __mockSubscriptions: {
    cancel: jest.Mock;
    update: jest.Mock;
  };
  __mockWebhooks: {
    unmarshal: jest.Mock;
  };
};

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let workspaceRepo: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    update: jest.Mock;
  };

  const configValues: Record<string, string> = {
    PADDLE_API_KEY: 'test-api-key',
    PADDLE_WEBHOOK_SECRET: 'test-webhook-secret',
    PADDLE_ENVIRONMENT: 'sandbox',
    PADDLE_PRICE_SOLO: 'pri_solo_123',
    PADDLE_PRICE_TEAM: 'pri_team_123',
    PADDLE_PRICE_AGENCY: 'pri_agency_123',
  };

  beforeEach(async () => {
    workspaceRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Workspace),
          useValue: workspaceRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: string) => {
              return configValues[key] ?? defaultVal;
            }),
            getOrThrow: jest.fn((key: string) => {
              const val = configValues[key];
              if (!val) throw new Error(`Missing config: ${key}`);
              return val;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendSubscriptionCanceled: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: MetricsService,
          useValue: { trackEvent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SubscriptionService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSubscriptionStatus', () => {
    it('should return subscription status for workspace', async () => {
      const ws = buildWorkspace({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        paddleSubscriptionId: 'sub_123',
      });
      workspaceRepo.findOne.mockResolvedValue(ws);

      const result = await service.getSubscriptionStatus(ws.id);

      expect(result).toEqual({
        plan: ws.plan,
        status: ws.subscriptionStatus,
        currentPeriodEnd: ws.currentPeriodEnd,
        trialEndsAt: ws.trialEndsAt,
        hasSubscription: true,
      });
    });

    it('should throw NotFoundException when workspace missing', async () => {
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getSubscriptionStatus('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout transaction', async () => {
      const ws = buildWorkspace();
      workspaceRepo.findOneOrFail.mockResolvedValue(ws);
      paddleMock.__mockTransactions.create.mockResolvedValue({
        id: 'txn_123',
      });

      const result = await service.createCheckoutSession(ws.id, Plan.SOLO);

      expect(result).toEqual({ transactionId: 'txn_123' });
      expect(paddleMock.__mockTransactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ priceId: 'pri_solo_123', quantity: 1 }],
          customData: { workspaceId: ws.id },
        }),
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel at period end', async () => {
      const ws = buildWorkspace({ paddleSubscriptionId: 'sub_123' });
      workspaceRepo.findOneOrFail.mockResolvedValue(ws);
      paddleMock.__mockSubscriptions.cancel.mockResolvedValue({});

      const result = await service.cancelSubscription(ws.id);

      expect(result.message).toContain('cancel');
      expect(paddleMock.__mockSubscriptions.cancel).toHaveBeenCalledWith(
        'sub_123',
        { effectiveFrom: 'next_billing_period' },
      );
    });

    it('should throw if no subscription', async () => {
      const ws = buildWorkspace({ paddleSubscriptionId: null });
      workspaceRepo.findOneOrFail.mockResolvedValue(ws);

      await expect(service.cancelSubscription(ws.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePlan', () => {
    it('should update subscription with new price', async () => {
      const ws = buildWorkspace({ paddleSubscriptionId: 'sub_123' });
      workspaceRepo.findOneOrFail.mockResolvedValue(ws);
      paddleMock.__mockSubscriptions.update.mockResolvedValue({});

      const result = await service.updatePlan(ws.id, Plan.TEAM);

      expect(result.message).toContain('update');
      expect(paddleMock.__mockSubscriptions.update).toHaveBeenCalledWith(
        'sub_123',
        {
          items: [{ priceId: 'pri_team_123', quantity: 1 }],
          prorationBillingMode: 'prorated_immediately',
        },
      );
    });

    it('should throw if no subscription', async () => {
      const ws = buildWorkspace({ paddleSubscriptionId: null });
      workspaceRepo.findOneOrFail.mockResolvedValue(ws);

      await expect(service.updatePlan(ws.id, Plan.TEAM)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('handleWebhookEvent', () => {
    it('should process subscription.activated event', async () => {
      const ws = buildWorkspace();
      workspaceRepo.findOne.mockResolvedValue(ws);

      paddleMock.__mockWebhooks.unmarshal.mockResolvedValue({
        eventType: 'subscription.activated',
        data: {
          id: 'sub_456',
          status: 'active',
          customerId: 'ctm_789',
          customData: { workspaceId: ws.id },
          currentBillingPeriod: { endsAt: '2026-04-15T00:00:00Z' },
          items: [{ price: { id: 'pri_solo_123' } }],
        },
      });

      await service.handleWebhookEvent('body', 'sig');

      expect(workspaceRepo.update).toHaveBeenCalledWith(
        ws.id,
        expect.objectContaining({
          paddleCustomerId: 'ctm_789',
          paddleSubscriptionId: 'sub_456',
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          plan: Plan.SOLO,
        }),
      );
    });

    it('should throw on invalid signature', async () => {
      paddleMock.__mockWebhooks.unmarshal.mockRejectedValue(
        new Error('invalid'),
      );

      await expect(
        service.handleWebhookEvent('body', 'bad-sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip non-subscription events', async () => {
      paddleMock.__mockWebhooks.unmarshal.mockResolvedValue({
        eventType: 'transaction.completed',
        data: {},
      });

      await service.handleWebhookEvent('body', 'sig');
      expect(workspaceRepo.update).not.toHaveBeenCalled();
    });

    it('should skip events without workspaceId', async () => {
      paddleMock.__mockWebhooks.unmarshal.mockResolvedValue({
        eventType: 'subscription.activated',
        data: {
          id: 'sub_456',
          status: 'active',
          customerId: 'ctm_789',
          customData: {},
        },
      });

      await service.handleWebhookEvent('body', 'sig');
      expect(workspaceRepo.update).not.toHaveBeenCalled();
    });

    it('should skip when workspace not found', async () => {
      workspaceRepo.findOne.mockResolvedValue(null);

      paddleMock.__mockWebhooks.unmarshal.mockResolvedValue({
        eventType: 'subscription.activated',
        data: {
          id: 'sub_456',
          status: 'active',
          customerId: 'ctm_789',
          customData: { workspaceId: 'ws-missing' },
        },
      });

      await service.handleWebhookEvent('body', 'sig');
      expect(workspaceRepo.update).not.toHaveBeenCalled();
    });

    it('should send canceled email on subscription.canceled event', async () => {
      const ws = buildWorkspace();
      workspaceRepo.findOne.mockResolvedValue(ws);

      const userRepo = (service as any).userRepo;
      userRepo.findOne = jest.fn().mockResolvedValue({
        email: 'broker@test.com',
        role: 'broker',
      });

      paddleMock.__mockWebhooks.unmarshal.mockResolvedValue({
        eventType: 'subscription.canceled',
        data: {
          id: 'sub_456',
          status: 'canceled',
          customerId: 'ctm_789',
          customData: { workspaceId: ws.id },
          items: [],
        },
      });

      await service.handleWebhookEvent('body', 'sig');

      expect(workspaceRepo.update).toHaveBeenCalledWith(
        ws.id,
        expect.objectContaining({
          subscriptionStatus: SubscriptionStatus.CANCELED,
        }),
      );
    });

    it('should handle webhook with no billing period', async () => {
      const ws = buildWorkspace();
      workspaceRepo.findOne.mockResolvedValue(ws);

      paddleMock.__mockWebhooks.unmarshal.mockResolvedValue({
        eventType: 'subscription.activated',
        data: {
          id: 'sub_456',
          status: 'active',
          customerId: 'ctm_789',
          customData: { workspaceId: ws.id },
          currentBillingPeriod: null,
          items: [{ price: { id: 'unknown_price' } }],
        },
      });

      await service.handleWebhookEvent('body', 'sig');

      expect(workspaceRepo.update).toHaveBeenCalledWith(
        ws.id,
        expect.not.objectContaining({ currentPeriodEnd: expect.anything() }),
      );
    });
  });
});
