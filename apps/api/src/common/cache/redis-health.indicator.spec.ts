import { HealthCheckError } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis-health.indicator';
import { createMockRedisCacheService } from '../../test-utils/mocks';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let mockRedisCache: ReturnType<typeof createMockRedisCacheService>;

  beforeEach(() => {
    mockRedisCache = createMockRedisCacheService();
    indicator = new RedisHealthIndicator(mockRedisCache as any);
  });

  it('should return healthy status when Redis is up', async () => {
    mockRedisCache.ping.mockResolvedValue(true);

    const result = await indicator.isHealthy('redis');

    expect(result).toEqual({ redis: { status: 'up' } });
  });

  it('should throw HealthCheckError when Redis is down', async () => {
    mockRedisCache.ping.mockResolvedValue(false);

    await expect(indicator.isHealthy('redis')).rejects.toThrow(
      HealthCheckError,
    );
  });
});
