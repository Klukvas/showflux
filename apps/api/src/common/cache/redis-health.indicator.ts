import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisCacheService } from './redis-cache.service.js';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisCacheService: RedisCacheService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isUp = await this.redisCacheService.ping();
    const result = this.getStatus(key, isUp);

    if (isUp) {
      return result;
    }

    throw new HealthCheckError('Redis check failed', result);
  }
}
