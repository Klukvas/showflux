import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { RedisCacheService } from './redis-cache.service.js';
import { CACHE_TTL } from './redis-cache.constants.js';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6380);
        const password = configService.get<string>('REDIS_PASSWORD', '');
        const authPart = password ? `:${password}@` : '';

        return {
          stores: [
            new Keyv({
              store: new KeyvRedis(`redis://${authPart}${host}:${port}`),
              namespace: 'showflux',
            }),
          ],
          ttl: CACHE_TTL.DEFAULT * 1000,
        };
      },
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
