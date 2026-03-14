import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../auth.service.js';
import { RedisCacheService } from '../../common/cache/redis-cache.service.js';
import { CACHE_KEY_PREFIX } from '../../common/cache/redis-cache.constants.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly redisCacheService: RedisCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.jti) {
      const blacklistKey = `${CACHE_KEY_PREFIX.BLACKLIST}:${payload.jti}`;
      const blacklisted = await this.redisCacheService.get(blacklistKey);
      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
      // Fail-open: if Redis is down, get() returns undefined and logs a warning.
      // Access tokens are short-lived (15m), limiting the window.
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      workspaceId: payload.workspaceId,
    };
  }
}
