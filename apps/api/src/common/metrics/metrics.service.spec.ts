jest.mock('@sentry/nestjs', () => ({
  addBreadcrumb: jest.fn(),
}));

import * as Sentry from '@sentry/nestjs';
import { Test } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get(MetricsService);
    jest.clearAllMocks();
  });

  it('should log structured event', () => {
    const logSpy = jest
      .spyOn((service as any).logger, 'log')
      .mockImplementation();

    service.trackEvent('user.registered', { userId: 'u-1' });

    expect(logSpy).toHaveBeenCalledWith(
      { event: 'user.registered', userId: 'u-1' },
      'metric:user.registered',
    );
  });

  it('should add Sentry breadcrumb', () => {
    jest.spyOn((service as any).logger, 'log').mockImplementation();

    service.trackEvent('subscription.checkout', { plan: 'solo' });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: 'business',
      message: 'subscription.checkout',
      data: { plan: 'solo' },
      level: 'info',
    });
  });

  it('should work with empty data', () => {
    jest.spyOn((service as any).logger, 'log').mockImplementation();

    service.trackEvent('trial.expired');

    expect(Sentry.addBreadcrumb).toHaveBeenCalled();
  });
});
