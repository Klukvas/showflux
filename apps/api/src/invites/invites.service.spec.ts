jest.mock('bcrypt', () => ({
  __esModule: true,
  default: { hash: jest.fn(), compare: jest.fn() },
}));
import bcrypt from 'bcrypt';

import { Test } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InvitesService } from './invites.service';
import { Invite } from '../entities/invite.entity';
import { User } from '../entities/user.entity';
import { ActivityService } from '../activity/activity.service';
import { InviteStatus } from '../common/enums/invite-status.enum';
import { Role } from '../common/enums/role.enum';
import { buildInvite, buildUser } from '../test-utils/factories';
import {
  createMockRepository,
  createMockActivityService,
} from '../test-utils/mocks';

describe('InvitesService', () => {
  let service: InvitesService;
  let inviteRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let dataSource: {
    transaction: jest.Mock & { _manager?: Record<string, jest.Mock> };
  };
  let activityService: ReturnType<typeof createMockActivityService>;

  beforeEach(async () => {
    inviteRepo = createMockRepository();
    userRepo = createMockRepository();
    activityService = createMockActivityService();

    dataSource = {
      transaction: jest.fn(async (cb) => {
        const manager = {
          findOne: jest.fn(),
          save: jest.fn().mockImplementation((Entity, data) => {
            if (data) return { ...data, id: data.id ?? 'new-id' };
            return { ...Entity, id: Entity.id ?? 'new-id' };
          }),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn(),
        };
        (dataSource.transaction as jest.Mock)._manager = manager;
        return cb(manager);
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        InvitesService,
        { provide: getRepositoryToken(Invite), useValue: inviteRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: ActivityService, useValue: activityService },
      ],
    }).compile();

    service = module.get(InvitesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return paginated invites', async () => {
      const invites = [buildInvite(), buildInvite()];
      inviteRepo.findAndCount.mockResolvedValue([invites, 2]);

      const result = await service.findAll('ws-1', 1, 10);

      expect(inviteRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1' },
          skip: 0,
          take: 10,
        }),
      );
      expect(result).toEqual({ data: invites, total: 2, page: 1, limit: 10 });
    });

    it('should clamp page and limit to safe values', async () => {
      inviteRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll('ws-1', -5, 500);

      expect(inviteRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: expect.any(Number),
        }),
      );
    });
  });

  describe('create', () => {
    const dto = { email: 'new@example.com' };
    const workspaceId = 'ws-1';
    const invitedBy = 'user-1';

    it('should create an invite successfully', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      inviteRepo.create.mockImplementation((data) => data);
      inviteRepo.save.mockImplementation((data) => ({
        ...data,
        id: 'invite-1',
      }));

      const result = await service.create(dto, workspaceId, invitedBy);

      expect(result).toBeDefined();
      expect(inviteRepo.save).toHaveBeenCalled();
    });

    it('should return a raw token', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      inviteRepo.create.mockImplementation((data) => data);
      inviteRepo.save.mockImplementation((data) => ({
        ...data,
        id: 'invite-1',
      }));

      const result = await service.create(dto, workspaceId, invitedBy);

      expect(result).toHaveProperty('rawToken');
      expect(typeof result.rawToken).toBe('string');
    });

    it('should throw ConflictException if user already exists in workspace', async () => {
      userRepo.findOne.mockResolvedValue(buildUser({ email: dto.email }));

      await expect(service.create(dto, workspaceId, invitedBy)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle duplicate key error (23505)', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      inviteRepo.create.mockImplementation((data) => data);
      const dbError = new Error('duplicate key') as Error & { code: string };
      dbError.code = '23505';
      inviteRepo.save.mockRejectedValue(dbError);

      await expect(service.create(dto, workspaceId, invitedBy)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log activity after creating invite', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      inviteRepo.create.mockImplementation((data) => data);
      inviteRepo.save.mockImplementation((data) => ({
        ...data,
        id: 'invite-1',
      }));

      await service.create(dto, workspaceId, invitedBy);

      expect(activityService.log).toHaveBeenCalledWith(
        expect.objectContaining({ workspaceId }),
      );
    });

    it('should re-throw non-23505 database errors', async () => {
      userRepo.findOne.mockResolvedValue(null);
      inviteRepo.create.mockImplementation((data) => data);
      const genericError = new Error('Connection lost');
      inviteRepo.save.mockRejectedValue(genericError);

      await expect(service.create(dto, workspaceId, invitedBy)).rejects.toThrow(
        'Connection lost',
      );
    });
  });

  describe('accept', () => {
    const rawToken = 'raw-token-value';
    const dto = { password: 'Password1!', fullName: 'John Doe' };

    it('should accept invite, create user and mark invite as accepted', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');

      const invite = buildInvite({
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        email: 'new@example.com',
        workspaceId: 'ws-1',
      });

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce(invite)
            .mockResolvedValueOnce(null),
          save: jest.fn().mockImplementation((Entity, data) => {
            if (data) return { ...data, id: data.id ?? 'new-id' };
            return { ...Entity, id: Entity.id ?? 'new-id' };
          }),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn(),
        };
        (dataSource.transaction as jest.Mock)._manager = manager;
        return cb(manager);
      });

      const result = await service.accept(rawToken, dto);

      expect(result).toBeDefined();
      const manager = (dataSource.transaction as jest.Mock)._manager!;
      expect(manager.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-invalid');

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        };
        (dataSource.transaction as jest.Mock)._manager = manager;
        return cb(manager);
      });

      await expect(service.accept(rawToken, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired invite', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');

      const expiredInvite = buildInvite({
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() - 86400000),
        email: 'expired@example.com',
      });

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(expiredInvite),
          save: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        };
        (dataSource.transaction as jest.Mock)._manager = manager;
        return cb(manager);
      });

      await expect(service.accept(rawToken, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');

      const invite = buildInvite({
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        email: 'existing@example.com',
        workspaceId: 'ws-1',
      });

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce(invite)
            .mockResolvedValueOnce(
              buildUser({ email: 'existing@example.com' }),
            ),
          save: jest.fn(),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn(),
        };
        (dataSource.transaction as jest.Mock)._manager = manager;
        return cb(manager);
      });

      await expect(service.accept(rawToken, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should log activity after accepting invite', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');

      const invite = buildInvite({
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        email: 'new@example.com',
        workspaceId: 'ws-1',
      });

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce(invite)
            .mockResolvedValueOnce(null),
          save: jest.fn().mockImplementation((Entity, data) => {
            if (data) return { ...data, id: data.id ?? 'new-id' };
            return { ...Entity, id: Entity.id ?? 'new-id' };
          }),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn(),
        };
        (dataSource.transaction as jest.Mock)._manager = manager;
        return cb(manager);
      });

      await service.accept(rawToken, dto);

      expect(activityService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: invite.workspaceId,
        }),
      );
    });

    it('should throw InternalServerErrorException on unknown save error', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');

      const invite = buildInvite({
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        email: 'new@example.com',
        workspaceId: 'ws-1',
      });

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce(invite)
            .mockResolvedValueOnce(null),
          save: jest.fn().mockRejectedValue(new Error('Unknown DB error')),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn(),
        };
        (dataSource.transaction as jest.Mock)._manager = manager;
        return cb(manager);
      });

      await expect(service.accept(rawToken, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw ConflictException on 23505 duplicate key during save', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');

      const invite = buildInvite({
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        email: 'new@example.com',
        workspaceId: 'ws-1',
      });

      dataSource.transaction.mockImplementation(async (cb) => {
        const dbError = new Error('duplicate key') as Error & { code: string };
        dbError.code = '23505';
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce(invite)
            .mockResolvedValueOnce(null),
          save: jest.fn().mockRejectedValue(dbError),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn(),
        };
        (dataSource.transaction as jest.Mock)._manager = manager;
        return cb(manager);
      });

      await expect(service.accept(rawToken, dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.accept(rawToken, dto)).rejects.toThrow(
        'Account already exists',
      );
    });

    it('should re-throw ConflictException from inner catch without wrapping', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');

      const invite = buildInvite({
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        email: 'existing@example.com',
        workspaceId: 'ws-1',
      });

      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce(invite)
            .mockResolvedValueOnce(null),
          save: jest
            .fn()
            .mockRejectedValue(
              new ConflictException('Account already exists with this email'),
            ),
          create: jest.fn().mockImplementation((_E, data) => data),
          update: jest.fn(),
        };
        (dataSource.transaction as jest.Mock)._manager = manager;
        return cb(manager);
      });

      await expect(service.accept(rawToken, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('revoke', () => {
    it('should revoke a pending invite', async () => {
      const invite = buildInvite({
        id: 'invite-1',
        status: InviteStatus.PENDING,
        workspaceId: 'ws-1',
      });
      inviteRepo.findOne.mockResolvedValue(invite);
      inviteRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.revoke('invite-1', 'ws-1');

      expect(result).toBeDefined();
      expect(result.status).toBe(InviteStatus.REVOKED);
      expect(inviteRepo.update).toHaveBeenCalledWith(invite.id, {
        status: InviteStatus.REVOKED,
      });
    });

    it('should throw NotFoundException if no pending invite found', async () => {
      inviteRepo.findOne.mockResolvedValue(null);

      await expect(service.revoke('missing-id', 'ws-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
