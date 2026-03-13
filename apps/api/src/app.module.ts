import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { WorkspaceModule } from './workspace/workspace.module.js';
import { UsersModule } from './users/users.module.js';
import { ListingsModule } from './listings/listings.module.js';
import { ShowingsModule } from './showings/showings.module.js';
import { OffersModule } from './offers/offers.module.js';
import { InvitesModule } from './invites/invites.module.js';
import { Workspace } from './entities/workspace.entity.js';
import { User } from './entities/user.entity.js';
import { Listing } from './entities/listing.entity.js';
import { Showing } from './entities/showing.entity.js';
import { Offer } from './entities/offer.entity.js';
import { Invite } from './entities/invite.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '..', '..', '.env'),
    }),
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
        entities: [Workspace, User, Listing, Showing, Offer, Invite],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    WorkspaceModule,
    UsersModule,
    ListingsModule,
    ShowingsModule,
    OffersModule,
    InvitesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
