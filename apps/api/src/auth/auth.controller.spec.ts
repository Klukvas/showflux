import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../common/enums/role.enum';
import { buildUser } from '../test-utils/factories';
import { createMockConfigService } from '../test-utils/mocks';

function createMockAuthService() {
  return {
    register: jest.fn(),
    login: jest.fn(),
    refreshAccessToken: jest.fn(),
    logout: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };
}

function createMockResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Record<string, jest.Mock>;
}

function createMockRequest(overrides: Record<string, unknown> = {}) {
  return {
    cookies: {},
    user: undefined,
    ...overrides,
  } as unknown as Record<string, unknown>;
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: ReturnType<typeof createMockAuthService>;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(async () => {
    authService = createMockAuthService();
    configService = createMockConfigService();

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and set refresh cookie', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'Str0ng!Pass',
        fullName: 'New User',
        workspaceName: 'Workspace',
      };
      const authResult = {
        accessToken: 'access-tok',
        refreshToken: 'refresh-tok',
        user: {
          id: 'u1',
          email: 'new@example.com',
          role: Role.BROKER,
          fullName: 'New User',
        },
      };
      authService.register.mockResolvedValue(authResult);
      const res = createMockResponse();

      const result = await controller.register(dto, res as any);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-tok',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result.accessToken).toBe('access-tok');
      expect(result.user.email).toBe('new@example.com');
    });
  });

  describe('login', () => {
    it('should call authService.login with req.user and set cookie', async () => {
      const user = buildUser({ id: 'u1', email: 'user@example.com' });
      const authResult = {
        accessToken: 'access-tok',
        refreshToken: 'refresh-tok',
        user: {
          id: 'u1',
          email: 'user@example.com',
          role: Role.BROKER,
          fullName: 'Test User',
        },
      };
      authService.login.mockResolvedValue(authResult);
      const req = createMockRequest({ user });
      const res = createMockResponse();

      const result = await controller.login(
        { email: 'user@example.com', password: 'pass' },
        req as any,
        res as any,
      );

      expect(authService.login).toHaveBeenCalledWith(user);
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-tok',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result.accessToken).toBe('access-tok');
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException when no refresh cookie is present', async () => {
      const req = createMockRequest({ cookies: {} });

      await expect(controller.refresh(req as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call authService.refreshAccessToken with cookie value', async () => {
      const req = createMockRequest({
        cookies: { refresh_token: 'tok-value' },
      });
      authService.refreshAccessToken.mockResolvedValue({
        accessToken: 'new-access',
      });

      const result = await controller.refresh(req as any);

      expect(authService.refreshAccessToken).toHaveBeenCalledWith('tok-value');
      expect(result.accessToken).toBe('new-access');
    });
  });

  describe('logout', () => {
    it('should call authService.logout and clear refresh cookie', async () => {
      const req = createMockRequest({
        cookies: { refresh_token: 'rf-tok' },
      });
      const res = createMockResponse();
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout('u1', req as any, res as any);

      expect(authService.logout).toHaveBeenCalledWith('u1', 'rf-tok');
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result.message).toBe('Logged out');
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.requestPasswordReset and return message', async () => {
      authService.requestPasswordReset.mockResolvedValue(undefined);

      const result = await controller.forgotPassword({
        email: 'user@example.com',
      });

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(
        'user@example.com',
      );
      expect(result.message).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword and return message', async () => {
      authService.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPassword({
        token: 'raw-reset-token',
        password: 'NewStr0ng!Pass',
      });

      expect(authService.resetPassword).toHaveBeenCalledWith(
        'raw-reset-token',
        'NewStr0ng!Pass',
      );
      expect(result.message).toBeDefined();
    });
  });
});
