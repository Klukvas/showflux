import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { RedisCacheService } from '../../common/cache/redis-cache.service';
import {
  createMockConfigService,
  createMockRedisCacheService,
} from '../../test-utils/mocks';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let redisCacheService: ReturnType<typeof createMockRedisCacheService>;

  beforeEach(() => {
    const configService = createMockConfigService({
      JWT_SECRET: 'test-secret',
    });
    redisCacheService = createMockRedisCacheService();

    strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      redisCacheService as unknown as RedisCacheService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return user payload for a valid token', async () => {
    const payload = {
      sub: 'u1',
      email: 'test@example.com',
      role: 'broker',
      workspaceId: 'ws1',
      tokenVersion: 0,
      type: 'access' as const,
      jti: 'jti-valid',
    };
    redisCacheService.get.mockResolvedValue(undefined);

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 'u1',
      email: 'test@example.com',
      role: 'broker',
      workspaceId: 'ws1',
    });
  });

  it('should throw UnauthorizedException for a blacklisted token', async () => {
    const payload = {
      sub: 'u1',
      email: 'test@example.com',
      role: 'broker',
      workspaceId: 'ws1',
      tokenVersion: 0,
      type: 'access' as const,
      jti: 'jti-blacklisted',
    };
    redisCacheService.get.mockResolvedValue('1');

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return user payload when jti is absent (no blacklist check)', async () => {
    const payload = {
      sub: 'u2',
      email: 'nojti@example.com',
      role: 'agent',
      workspaceId: 'ws2',
      tokenVersion: 0,
      type: 'access' as const,
      jti: undefined as unknown as string,
    };

    const result = await strategy.validate(payload);

    expect(redisCacheService.get).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: 'u2',
      email: 'nojti@example.com',
      role: 'agent',
      workspaceId: 'ws2',
    });
  });

  it('should return user payload when Redis returns undefined (fail-open)', async () => {
    const payload = {
      sub: 'u3',
      email: 'fail-open@example.com',
      role: 'broker',
      workspaceId: 'ws3',
      tokenVersion: 0,
      type: 'access' as const,
      jti: 'jti-fail-open',
    };
    redisCacheService.get.mockResolvedValue(undefined);

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 'u3',
      email: 'fail-open@example.com',
      role: 'broker',
      workspaceId: 'ws3',
    });
  });
});
