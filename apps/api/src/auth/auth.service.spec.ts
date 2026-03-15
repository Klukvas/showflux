jest.mock('bcrypt', () => ({
  __esModule: true,
  default: { hash: jest.fn(), compare: jest.fn() },
}));

import { Test } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { PasswordReset } from '../entities/password-reset.entity';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { EmailService } from '../common/email/email.service';
import { Role } from '../common/enums/role.enum';
import { Plan } from '../common/enums/plan.enum';
import { buildUser, buildPasswordReset } from '../test-utils/factories';
import {
  createMockRepository,
  createMockJwtService,
  createMockConfigService,
  createMockRedisCacheService,
  createMockEmailService,
} from '../test-utils/mocks';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof createMockRepository>;
  let workspaceRepo: ReturnType<typeof createMockRepository>;
  let passwordResetRepo: ReturnType<typeof createMockRepository>;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let configService: ReturnType<typeof createMockConfigService>;
  let dataSource: { transaction: jest.Mock };
  let redisCacheService: ReturnType<typeof createMockRedisCacheService>;
  let emailService: ReturnType<typeof createMockEmailService>;

  beforeEach(async () => {
    userRepo = createMockRepository();
    workspaceRepo = createMockRepository();
    passwordResetRepo = createMockRepository();
    jwtService = createMockJwtService();
    configService = createMockConfigService();
    redisCacheService = createMockRedisCacheService();
    emailService = createMockEmailService();

    dataSource = {
      transaction: jest.fn(async (cb) => {
        const manager = {
          findOne: jest.fn(),
          save: jest.fn().mockImplementation((v) => v),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn(),
          increment: jest.fn(),
          createQueryBuilder: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: jest.fn(),
          })),
        };
        return cb(manager);
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        {
          provide: getRepositoryToken(PasswordReset),
          useValue: passwordResetRepo,
        },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: DataSource, useValue: dataSource },
        { provide: RedisCacheService, useValue: redisCacheService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------
  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Str0ng!Pass',
      fullName: 'New User',
      workspaceName: 'My Workspace',
    };

    it('should register a new user and return auth result', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      jwtService.sign.mockReturnValue('token-value');

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn().mockImplementation((v) => ({
            ...v,
            id: v.id ?? 'generated-id',
          })),
          create: jest.fn().mockImplementation((_E, data) => ({
            ...data,
            id: data.id ?? 'ws-id',
          })),
        };
        return cb(manager);
      });

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('token-value');
      expect(result.refreshToken).toBe('token-value');
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.fullName).toBe('New User');
      expect(bcrypt.hash).toHaveBeenCalledWith('Str0ng!Pass', 12);
    });

    it('should throw ConflictException when email already exists', async () => {
      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValue(buildUser({ email: 'new@example.com' })),
          save: jest.fn(),
          create: jest.fn(),
        };
        return cb(manager);
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException on duplicate key error (23505)', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      dataSource.transaction.mockImplementation(async (cb) => {
        const duplicateErr = Object.assign(new Error('duplicate'), {
          code: '23505',
        });
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest
            .fn()
            .mockResolvedValueOnce({
              id: 'ws-id',
              name: 'My Workspace',
              plan: Plan.SOLO,
            })
            .mockRejectedValueOnce(duplicateErr),
          create: jest
            .fn()
            .mockImplementation((_E, data) => ({ ...data, id: 'ws-id' })),
        };
        return cb(manager);
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create workspace with Plan.SOLO', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      jwtService.sign.mockReturnValue('tok');

      let capturedCreateArgs: unknown[] = [];
      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn().mockImplementation((v) => ({ ...v, id: 'id' })),
          create: jest.fn().mockImplementation((_E, data) => {
            capturedCreateArgs.push({ entity: _E, data });
            return { ...data, id: 'id' };
          }),
        };
        return cb(manager);
      });

      await service.register(registerDto);

      const wsCreate = capturedCreateArgs.find(
        (a: any) => a.entity === Workspace,
      ) as any;
      expect(wsCreate.data.plan).toBe(Plan.SOLO);
    });

    it('should create user with Role.BROKER', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      jwtService.sign.mockReturnValue('tok');

      let capturedCreateArgs: unknown[] = [];
      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn().mockImplementation((v) => ({ ...v, id: 'id' })),
          create: jest.fn().mockImplementation((_E, data) => {
            capturedCreateArgs.push({ entity: _E, data });
            return { ...data, id: 'id' };
          }),
        };
        return cb(manager);
      });

      await service.register(registerDto);

      const userCreate = capturedCreateArgs.find(
        (a: any) => a.entity === User,
      ) as any;
      expect(userCreate.data.role).toBe(Role.BROKER);
    });
  });

  // ---------------------------------------------------------------------------
  // validateUser
  // ---------------------------------------------------------------------------
  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const user = buildUser({
        email: 'test@example.com',
        passwordHash: 'hashed',
        isActive: true,
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'pass');

      expect(result).toEqual(user);
    });

    it('should return null when password does not match', async () => {
      const user = buildUser({
        email: 'test@example.com',
        isActive: true,
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong');

      expect(result).toBeNull();
    });

    it('should return null when user is not found but still compare with dummy hash', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'missing@example.com',
        'password',
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password',
        '$2b$12$000000000000000000000uGlBcfGFG50mCEdvLqMgaHNJD4qjzSsO',
      );
    });

    it('should return null when user is inactive', async () => {
      const user = buildUser({
        email: 'test@example.com',
        isActive: false,
      });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'pass');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
  describe('login', () => {
    it('should return auth result with tokens and user info', async () => {
      const user = buildUser({
        id: 'u1',
        email: 'test@example.com',
        role: Role.BROKER,
        fullName: 'Test User',
      });
      jwtService.sign.mockReturnValue('signed-token');

      const result = await service.login(user);

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(result.user).toEqual({
        id: 'u1',
        email: 'test@example.com',
        role: Role.BROKER,
        fullName: 'Test User',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // refreshAccessToken
  // ---------------------------------------------------------------------------
  describe('refreshAccessToken', () => {
    const basePayload = {
      sub: 'u1',
      email: 'test@example.com',
      role: 'broker',
      workspaceId: 'ws1',
      tokenVersion: 0,
      type: 'refresh' as const,
      jti: 'jti-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should return a new access token on success', async () => {
      jwtService.verify.mockReturnValue(basePayload);
      redisCacheService.get.mockResolvedValue(undefined);
      userRepo.findOne.mockResolvedValue(
        buildUser({ id: 'u1', isActive: true, tokenVersion: 0 }),
      );
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshAccessToken('valid-refresh');

      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException when token type is not refresh', async () => {
      jwtService.verify.mockReturnValue({ ...basePayload, type: 'access' });

      await expect(service.refreshAccessToken('not-a-refresh')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is blacklisted', async () => {
      jwtService.verify.mockReturnValue(basePayload);
      redisCacheService.get.mockResolvedValue('1');

      await expect(
        service.refreshAccessToken('blacklisted-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      jwtService.verify.mockReturnValue(basePayload);
      redisCacheService.get.mockResolvedValue(undefined);
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshAccessToken('no-user-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      jwtService.verify.mockReturnValue(basePayload);
      redisCacheService.get.mockResolvedValue(undefined);
      userRepo.findOne.mockResolvedValue(
        buildUser({ id: 'u1', isActive: false }),
      );

      await expect(
        service.refreshAccessToken('inactive-user-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token version does not match', async () => {
      jwtService.verify.mockReturnValue(basePayload);
      redisCacheService.get.mockResolvedValue(undefined);
      userRepo.findOne.mockResolvedValue(
        buildUser({ id: 'u1', isActive: true, tokenVersion: 5 }),
      );

      await expect(
        service.refreshAccessToken('stale-version-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should wrap non-UnauthorizedException errors as UnauthorizedException', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.refreshAccessToken('invalid-jwt')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------
  describe('logout', () => {
    it('should blacklist refresh token JTI and increment tokenVersion', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      jwtService.verify.mockReturnValue({
        jti: 'jti-to-blacklist',
        exp: futureExp,
      });

      await service.logout('u1', 'valid-refresh-token');

      expect(redisCacheService.set).toHaveBeenCalledWith(
        'blacklist:jti-to-blacklist',
        '1',
        expect.any(Number),
      );
      expect(userRepo.increment).toHaveBeenCalledWith(
        { id: 'u1' },
        'tokenVersion',
        1,
      );
    });

    it('should only increment tokenVersion when no refresh token is provided', async () => {
      await service.logout('u1');

      expect(jwtService.verify).not.toHaveBeenCalled();
      expect(redisCacheService.set).not.toHaveBeenCalled();
      expect(userRepo.increment).toHaveBeenCalledWith(
        { id: 'u1' },
        'tokenVersion',
        1,
      );
    });

    it('should handle invalid refresh token gracefully and still increment tokenVersion', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await service.logout('u1', 'expired-token');

      expect(redisCacheService.set).not.toHaveBeenCalled();
      expect(userRepo.increment).toHaveBeenCalledWith(
        { id: 'u1' },
        'tokenVersion',
        1,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // requestPasswordReset
  // ---------------------------------------------------------------------------
  describe('requestPasswordReset', () => {
    it('should create a password reset token for existing user', async () => {
      const user = buildUser({ id: 'u1', email: 'user@example.com' });
      userRepo.findOne.mockResolvedValue(user);
      passwordResetRepo.create.mockImplementation((data) => data);
      passwordResetRepo.save.mockResolvedValue({});

      await service.requestPasswordReset('user@example.com');

      expect(passwordResetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      );
      expect(passwordResetRepo.save).toHaveBeenCalled();
      expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(String),
      );
    });

    it('should return silently when user is not found (no enumeration)', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.requestPasswordReset('nobody@example.com'),
      ).resolves.toBeUndefined();

      expect(passwordResetRepo.save).not.toHaveBeenCalled();
      expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // resetPassword
  // ---------------------------------------------------------------------------
  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const reset = buildPasswordReset({
        userId: 'u1',
        expiresAt: new Date(Date.now() + 3_600_000),
        usedAt: null,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      const mockQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(reset),
          save: jest.fn().mockImplementation((v) => v),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn().mockResolvedValue(undefined),
          increment: jest.fn().mockResolvedValue(undefined),
          createQueryBuilder: jest.fn(() => mockQb),
        };
        return cb(manager);
      });

      await service.resetPassword('raw-token', 'NewStr0ng!Pass');

      expect(bcrypt.hash).toHaveBeenCalledWith('NewStr0ng!Pass', 12);
    });

    it('should throw BadRequestException when reset token is not found', async () => {
      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          increment: jest.fn(),
          createQueryBuilder: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: jest.fn(),
          })),
        };
        return cb(manager);
      });

      await expect(
        service.resetPassword('invalid-raw-token', 'NewPass123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when reset token has expired', async () => {
      const expiredReset = buildPasswordReset({
        userId: 'u1',
        expiresAt: new Date(Date.now() - 3_600_000),
        usedAt: null,
      });

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(expiredReset),
          save: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          increment: jest.fn(),
          createQueryBuilder: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: jest.fn(),
          })),
        };
        return cb(manager);
      });

      await expect(
        service.resetPassword('expired-raw-token', 'NewPass123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should invalidate user cache after successful reset', async () => {
      const reset = buildPasswordReset({
        userId: 'u1',
        expiresAt: new Date(Date.now() + 3_600_000),
        usedAt: null,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      const mockQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(reset),
          save: jest.fn().mockImplementation((v) => v),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn().mockResolvedValue(undefined),
          increment: jest.fn().mockResolvedValue(undefined),
          createQueryBuilder: jest.fn(() => mockQb),
        };
        return cb(manager);
      });

      await service.resetPassword('valid-raw-token', 'NewStr0ng!Pass');

      expect(redisCacheService.del).toHaveBeenCalledWith('user:u1');
    });
  });
});
