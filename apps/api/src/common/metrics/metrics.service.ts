import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

export type MetricEvent =
  | 'user.registered'
  | 'subscription.checkout'
  | 'subscription.canceled'
  | 'subscription.upgraded'
  | 'trial.expired';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  trackEvent(name: MetricEvent, data: Record<string, unknown> = {}): void {
    this.logger.log({ event: name, ...data }, `metric:${name}`);

    Sentry.addBreadcrumb({
      category: 'business',
      message: name,
      data,
      level: 'info',
    });
  }
}
