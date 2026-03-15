import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionCronService } from './subscription-cron.service';
import { Workspace } from '../entities/workspace.entity';
import { User } from '../entities/user.entity';
import { EmailService } from '../common/email/email.service';
import { MetricsService } from '../common/metrics/metrics.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';
import { Role } from '../common/enums/role.enum';

describe('SubscriptionCronService', () => {
  let service: SubscriptionCronService;
  let workspaceRepo: jest.Mocked<
    Pick<Repository<Workspace>, 'find' | 'update'>
  >;
  let userRepo: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
  let emailService: jest.Mocked<
    Pick<
      EmailService,
      'sendTrialExpired' | 'sendTrialEndingSoon' | 'sendPaymentFailed'
    >
  >;
  let redisCacheService: jest.Mocked<Pick<RedisCacheService, 'get' | 'set'>>;

  const mockBroker = {
    id: 'u-1',
    email: 'broker@example.com',
    role: Role.BROKER,
    workspaceId: 'ws-1',
    isActive: true,
  } as User;

  const mockWorkspace = {
    id: 'ws-1',
    name: 'Acme Realty',
    subscriptionStatus: SubscriptionStatus.TRIALING,
    trialEndsAt: new Date('2024-01-01'),
  } as Workspace;

  beforeEach(async () => {
    workspaceRepo = { find: jest.fn(), update: jest.fn() };
    userRepo = { findOne: jest.fn() };
    emailService = {
      sendTrialExpired: jest.fn().mockResolvedValue(undefined),
      sendTrialEndingSoon: jest.fn().mockResolvedValue(undefined),
      sendPaymentFailed: jest.fn().mockResolvedValue(undefined),
    };
    redisCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        SubscriptionCronService,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: EmailService, useValue: emailService },
        {
          provide: MetricsService,
          useValue: { trackEvent: jest.fn() },
        },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get(SubscriptionCronService);
  });

  describe('handleExpiredTrials', () => {
    it('should cancel expired trials and send email', async () => {
      workspaceRepo.find.mockResolvedValue([mockWorkspace]);
      userRepo.findOne.mockResolvedValue(mockBroker);

      await service.handleExpiredTrials();

      expect(workspaceRepo.update).toHaveBeenCalledWith('ws-1', {
        subscriptionStatus: SubscriptionStatus.CANCELED,
      });
      expect(emailService.sendTrialExpired).toHaveBeenCalledWith(
        'broker@example.com',
        'Acme Realty',
      );
    });

    it('should skip email if no broker found', async () => {
      workspaceRepo.find.mockResolvedValue([mockWorkspace]);
      userRepo.findOne.mockResolvedValue(null);

      await service.handleExpiredTrials();

      expect(workspaceRepo.update).toHaveBeenCalled();
      expect(emailService.sendTrialExpired).not.toHaveBeenCalled();
    });

    it('should handle empty expired list', async () => {
      workspaceRepo.find.mockResolvedValue([]);

      await service.handleExpiredTrials();

      expect(workspaceRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('handleTrialReminders', () => {
    it('should send reminder and set Redis dedupe key', async () => {
      const expiringWs = {
        ...mockWorkspace,
        trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      } as Workspace;
      workspaceRepo.find.mockResolvedValue([expiringWs]);
      userRepo.findOne.mockResolvedValue(mockBroker);
      redisCacheService.get.mockResolvedValue(null);

      await service.handleTrialReminders();

      expect(emailService.sendTrialEndingSoon).toHaveBeenCalledWith(
        'broker@example.com',
        'Acme Realty',
        expect.any(Number),
      );
      expect(redisCacheService.set).toHaveBeenCalledWith(
        'trial_reminder:ws-1',
        '1',
        expect.any(Number),
      );
    });

    it('should skip if reminder already sent (Redis key exists)', async () => {
      const expiringWs = {
        ...mockWorkspace,
        trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      } as Workspace;
      workspaceRepo.find.mockResolvedValue([expiringWs]);
      redisCacheService.get.mockResolvedValue('1');

      await service.handleTrialReminders();

      expect(emailService.sendTrialEndingSoon).not.toHaveBeenCalled();
    });

    it('should skip email if no broker found', async () => {
      const expiringWs = {
        ...mockWorkspace,
        trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      } as Workspace;
      workspaceRepo.find.mockResolvedValue([expiringWs]);
      userRepo.findOne.mockResolvedValue(null);

      await service.handleTrialReminders();

      expect(emailService.sendTrialEndingSoon).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentFailureReminders', () => {
    it('should send payment-failed email to past-due workspaces', async () => {
      const pastDueWs = {
        ...mockWorkspace,
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
      } as Workspace;
      workspaceRepo.find.mockResolvedValue([pastDueWs]);
      userRepo.findOne.mockResolvedValue(mockBroker);

      await service.handlePaymentFailureReminders();

      expect(emailService.sendPaymentFailed).toHaveBeenCalledWith(
        'broker@example.com',
        'Acme Realty',
      );
    });

    it('should skip email if no broker found', async () => {
      const pastDueWs = {
        ...mockWorkspace,
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
      } as Workspace;
      workspaceRepo.find.mockResolvedValue([pastDueWs]);
      userRepo.findOne.mockResolvedValue(null);

      await service.handlePaymentFailureReminders();

      expect(emailService.sendPaymentFailed).not.toHaveBeenCalled();
    });

    it('should handle empty past-due list', async () => {
      workspaceRepo.find.mockResolvedValue([]);

      await service.handlePaymentFailureReminders();

      expect(emailService.sendPaymentFailed).not.toHaveBeenCalled();
    });
  });
});
