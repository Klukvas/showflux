import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { randomUUID } from 'node:crypto';
import type { Cache } from 'cache-manager';
import { CACHE_TTL } from './redis-cache.constants.js';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cache.get<T>(key);
    } catch (error) {
      this.logger.warn(`Cache GET failed for key "${key}": ${error}`);
      return undefined;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = CACHE_TTL.DEFAULT,
  ): Promise<void> {
    try {
      await this.cache.set(key, value, ttlSeconds * 1000);
    } catch (error) {
      this.logger.warn(`Cache SET failed for key "${key}": ${error}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (error) {
      this.logger.warn(`Cache DEL failed for key "${key}": ${error}`);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const sentinelKey = `__redis_health__:${randomUUID()}`;
      await this.cache.set(sentinelKey, 'ok', 5_000);
      const result = await this.cache.get<string>(sentinelKey);
      await this.cache.del(sentinelKey);
      return result === 'ok';
    } catch (error) {
      this.logger.warn(`Redis ping failed: ${error}`);
      return false;
    }
  }
}
