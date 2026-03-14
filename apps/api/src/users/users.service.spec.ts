jest.mock('bcrypt', () => ({
  __esModule: true,
  default: { hash: jest.fn(), compare: jest.fn() },
}));
import bcrypt from 'bcrypt';

import { Test } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { buildUser } from '../test-utils/factories';
import {
  createMockRepository,
  createMockRedisCacheService,
  createMockDashboardService,
} from '../test-utils/mocks';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: ReturnType<typeof createMockRepository>;
  let cacheService: ReturnType<typeof createMockRedisCacheService>;
  let dashboardService: ReturnType<typeof createMockDashboardService>;

  beforeEach(async () => {
    userRepo = createMockRepository();
    cacheService = createMockRedisCacheService();
    dashboardService = createMockDashboardService();

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: RedisCacheService, useValue: cacheService },
        { provide: DashboardService, useValue: dashboardService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── findById ──────────────────────────────────────────────────────────

  it('findById returns cached user', async () => {
    const { passwordHash: _, ...stripped } = buildUser({
      id: 'u1',
      passwordHash: 'secret',
    });
    cacheService.get.mockResolvedValue(stripped);

    const result = await service.findById('u1');

    expect(cacheService.get).toHaveBeenCalledWith('user:u1');
    expect(userRepo.findOne).not.toHaveBeenCalled();
    expect(result).toBeDefined();
    expect((result as any).passwordHash).toBeUndefined();
  });

  it('findById fetches from repo and caches', async () => {
    const user = buildUser({ id: 'u1', passwordHash: 'secret' });
    cacheService.get.mockResolvedValue(null);
    userRepo.findOne.mockResolvedValue(user);

    const result = await service.findById('u1');

    expect(userRepo.findOne).toHaveBeenCalled();
    expect(cacheService.set).toHaveBeenCalledWith(
      'user:u1',
      expect.any(Object),
      300,
    );
    expect((result as any).passwordHash).toBeUndefined();
  });

  it('findById throws NotFoundException when user does not exist', async () => {
    cacheService.get.mockResolvedValue(null);
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ── updateProfile ─────────────────────────────────────────────────────

  it('updateProfile updates and invalidates cache', async () => {
    const user = buildUser({ id: 'u1', firstName: 'Old', passwordHash: 'h' });
    userRepo.findOne.mockResolvedValue(user);
    userRepo.save.mockImplementation((u) => Promise.resolve(u));

    const result = await service.updateProfile('u1', { firstName: 'New' });

    expect(userRepo.save).toHaveBeenCalled();
    expect(cacheService.del).toHaveBeenCalledWith('user:u1');
    expect((result as any).passwordHash).toBeUndefined();
  });

  it('updateProfile throws NotFoundException when user not found', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateProfile('missing', { firstName: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updateProfile does not throw when cache del fails', async () => {
    const user = buildUser({ id: 'u1', passwordHash: 'h' });
    userRepo.findOne.mockResolvedValue(user);
    userRepo.save.mockImplementation((u) => Promise.resolve(u));
    cacheService.del.mockRejectedValue(new Error('Redis down'));

    await expect(
      service.updateProfile('u1', { firstName: 'New' }),
    ).resolves.toBeDefined();
  });

  // ── changePassword ────────────────────────────────────────────────────

  it('changePassword succeeds with correct current password', async () => {
    const user = buildUser({
      id: 'u1',
      passwordHash: 'hashed',
      tokenVersion: 0,
    });
    userRepo.findOne.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('newHashed');

    await service.changePassword('u1', {
      currentPassword: 'old',
      newPassword: 'new123',
    });

    expect(bcrypt.compare).toHaveBeenCalledWith('old', 'hashed');
    expect(bcrypt.hash).toHaveBeenCalledWith('new123', expect.any(Number));
    expect(userRepo.update).toHaveBeenCalledWith('u1', {
      passwordHash: 'newHashed',
    });
    expect(userRepo.increment).toHaveBeenCalledWith(
      { id: 'u1' },
      'tokenVersion',
      1,
    );
    expect(cacheService.del).toHaveBeenCalledWith('user:u1');
  });

  it('changePassword throws BadRequestException for wrong current password', async () => {
    const user = buildUser({ id: 'u1', passwordHash: 'hashed' });
    userRepo.findOne.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.changePassword('u1', {
        currentPassword: 'wrong',
        newPassword: 'new',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('changePassword throws NotFoundException when user not found', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.changePassword('missing', {
        currentPassword: 'a',
        newPassword: 'b',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('changePassword does not throw when cache del fails', async () => {
    const user = buildUser({
      id: 'u1',
      passwordHash: 'hashed',
      tokenVersion: 0,
    });
    userRepo.findOne.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('newHashed');
    cacheService.del.mockRejectedValue(new Error('Redis down'));

    await expect(
      service.changePassword('u1', {
        currentPassword: 'old',
        newPassword: 'new123',
      }),
    ).resolves.not.toThrow();
  });

  // ── findByWorkspace ───────────────────────────────────────────────────

  it('findByWorkspace returns paginated results', async () => {
    const users = [
      buildUser({ id: 'u1', passwordHash: 'h1' }),
      buildUser({ id: 'u2', passwordHash: 'h2' }),
    ];
    userRepo.findAndCount.mockResolvedValue([users, 2]);

    const result = await service.findByWorkspace('ws1', 1, 10);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(userRepo.findAndCount).toHaveBeenCalled();
  });

  it('findByWorkspace strips passwordHash from all results', async () => {
    const users = [
      buildUser({ id: 'u1', passwordHash: 'h1' }),
      buildUser({ id: 'u2', passwordHash: 'h2' }),
    ];
    userRepo.findAndCount.mockResolvedValue([users, 2]);

    const result = await service.findByWorkspace('ws1', 1, 10);

    for (const user of result.data) {
      expect((user as any).passwordHash).toBeUndefined();
    }
  });

  it('findByWorkspace clamps page and limit values', async () => {
    userRepo.findAndCount.mockResolvedValue([[], 0]);

    await service.findByWorkspace('ws1', -5, 500);

    const callArgs = userRepo.findAndCount.mock.calls[0][0];
    expect(callArgs.skip).toBeGreaterThanOrEqual(0);
    expect(callArgs.take).toBeLessThanOrEqual(100);
  });

  // ── deactivateUser ────────────────────────────────────────────────────

  it('deactivateUser sets isActive to false and invalidates cache', async () => {
    const user = buildUser({
      id: 'u1',
      workspaceId: 'ws1',
      isActive: true,
    });
    userRepo.findOne.mockResolvedValue(user);

    await service.deactivateUser('u1', 'ws1', 'admin1');

    expect(userRepo.update).toHaveBeenCalledWith('u1', { isActive: false });
    expect(cacheService.del).toHaveBeenCalledWith('user:u1');
    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });

  it('deactivateUser throws ForbiddenException when deactivating self', async () => {
    await expect(service.deactivateUser('u1', 'ws1', 'u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('deactivateUser throws NotFoundException when user not found', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.deactivateUser('missing', 'ws1', 'admin1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('deactivateUser does not throw when cache del fails', async () => {
    const user = buildUser({
      id: 'u1',
      workspaceId: 'ws1',
      isActive: true,
    });
    userRepo.findOne.mockResolvedValue(user);
    cacheService.del.mockRejectedValue(new Error('Redis down'));
    dashboardService.invalidateSummary.mockRejectedValue(
      new Error('Redis down'),
    );

    await expect(
      service.deactivateUser('u1', 'ws1', 'admin1'),
    ).resolves.toBeDefined();
  });

  // ── reactivateUser ────────────────────────────────────────────────────

  it('reactivateUser sets isActive to true and invalidates cache', async () => {
    const user = buildUser({
      id: 'u1',
      workspaceId: 'ws1',
      isActive: false,
    });
    userRepo.findOne.mockResolvedValue(user);

    await service.reactivateUser('u1', 'ws1');

    expect(userRepo.update).toHaveBeenCalledWith('u1', { isActive: true });
    expect(cacheService.del).toHaveBeenCalledWith('user:u1');
    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });

  it('reactivateUser throws NotFoundException when user not found', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.reactivateUser('missing', 'ws1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('reactivateUser does not throw when cache del fails', async () => {
    const user = buildUser({
      id: 'u1',
      workspaceId: 'ws1',
      isActive: false,
    });
    userRepo.findOne.mockResolvedValue(user);
    cacheService.del.mockRejectedValue(new Error('Redis down'));
    dashboardService.invalidateSummary.mockRejectedValue(
      new Error('Redis down'),
    );

    await expect(service.reactivateUser('u1', 'ws1')).resolves.toBeDefined();
  });
});
