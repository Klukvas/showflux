import { join } from 'node:path';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard.js';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { AuthModule } from './auth/auth.module.js';
import { WorkspaceModule } from './workspace/workspace.module.js';
import { UsersModule } from './users/users.module.js';
import { ListingsModule } from './listings/listings.module.js';
import { ShowingsModule } from './showings/showings.module.js';
import { OffersModule } from './offers/offers.module.js';
import { InvitesModule } from './invites/invites.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { ActivityModule } from './activity/activity.module.js';
import { HealthModule } from './health/health.module.js';
import { SubscriptionModule } from './subscription/subscription.module.js';
import { RedisCacheModule } from './common/cache/redis-cache.module.js';
import { MetricsModule } from './common/metrics/metrics.module.js';
import { Workspace } from './entities/workspace.entity.js';
import { User } from './entities/user.entity.js';
import { Listing } from './entities/listing.entity.js';
import { Showing } from './entities/showing.entity.js';
import { Offer } from './entities/offer.entity.js';
import { Invite } from './entities/invite.entity.js';
import { PasswordReset } from './entities/password-reset.entity.js';
import { Activity } from './entities/activity.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '..', '..', '.env'),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.getOrThrow<string>('DATABASE_USER'),
        password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
        database: configService.getOrThrow<string>('DATABASE_NAME'),
        ssl:
          configService.get<string>('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: true }
            : false,
        entities: [
          Workspace,
          User,
          Listing,
          Showing,
          Offer,
          Invite,
          PasswordReset,
          Activity,
        ],
        synchronize:
          configService.get<string>('NODE_ENV') === 'development' &&
          configService.get<string>('ALLOW_SCHEMA_SYNC') === 'true',
        extra: {
          max: configService.get<number>('DATABASE_POOL_MAX', 20),
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
          application_name: 'showflux_api',
        },
      }),
    }),
    RedisCacheModule,
    MetricsModule,
    AuthModule,
    WorkspaceModule,
    UsersModule,
    ListingsModule,
    ShowingsModule,
    OffersModule,
    InvitesModule,
    DashboardModule,
    ActivityModule,
    SubscriptionModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
