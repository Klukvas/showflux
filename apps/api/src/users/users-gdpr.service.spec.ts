import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersGdprService } from './users-gdpr.service';
import { User } from '../entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { Listing } from '../entities/listing.entity';
import { Showing } from '../entities/showing.entity';
import { Offer } from '../entities/offer.entity';
import { Activity } from '../entities/activity.entity';
import { createMockRepository } from '../test-utils/mocks';
import { buildUser } from '../test-utils/factories';

describe('UsersGdprService', () => {
  let service: UsersGdprService;
  let userRepo: ReturnType<typeof createMockRepository>;
  let workspaceRepo: ReturnType<typeof createMockRepository>;
  let listingRepo: ReturnType<typeof createMockRepository>;
  let showingRepo: ReturnType<typeof createMockRepository>;
  let offerRepo: ReturnType<typeof createMockRepository>;
  let activityRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    userRepo = createMockRepository();
    workspaceRepo = createMockRepository();
    listingRepo = createMockRepository();
    showingRepo = createMockRepository();
    offerRepo = createMockRepository();
    activityRepo = createMockRepository();
    dataSource = {
      transaction: jest.fn(async (cb) => {
        const manager = {
          update: jest.fn(),
          increment: jest.fn(),
          delete: jest.fn(),
        };
        return cb(manager);
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersGdprService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: getRepositoryToken(Listing), useValue: listingRepo },
        { provide: getRepositoryToken(Showing), useValue: showingRepo },
        { provide: getRepositoryToken(Offer), useValue: offerRepo },
        { provide: getRepositoryToken(Activity), useValue: activityRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(UsersGdprService);
  });

  describe('exportUserData', () => {
    it('should export all user data', async () => {
      const user = buildUser({ id: 'u-1', workspaceId: 'ws-1' });
      userRepo.findOne.mockResolvedValue(user);
      workspaceRepo.findOne.mockResolvedValue({
        id: 'ws-1',
        name: 'Acme',
        plan: 'solo',
        createdAt: new Date(),
      });
      listingRepo.find.mockResolvedValue([{ id: 'l-1', address: '123 Main' }]);
      showingRepo.find.mockResolvedValue([]);
      offerRepo.find.mockResolvedValue([]);
      activityRepo.find.mockResolvedValue([]);

      const result = await service.exportUserData('u-1');

      expect(result.user.id).toBe('u-1');
      expect(result.workspace?.name).toBe('Acme');
      expect(result.listings).toHaveLength(1);
      expect(result.exportedAt).toBeDefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.exportUserData('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle null workspace', async () => {
      const user = buildUser({ id: 'u-1', workspaceId: 'ws-1' });
      userRepo.findOne.mockResolvedValue(user);
      workspaceRepo.findOne.mockResolvedValue(null);
      listingRepo.find.mockResolvedValue([]);
      showingRepo.find.mockResolvedValue([]);
      offerRepo.find.mockResolvedValue([]);
      activityRepo.find.mockResolvedValue([]);

      const result = await service.exportUserData('u-1');

      expect(result.workspace).toBeNull();
    });
  });

  describe('deleteUserData', () => {
    it('should anonymize user data and delete activities', async () => {
      const user = buildUser({ id: 'u-1' });
      userRepo.findOne.mockResolvedValue(user);

      let managerCalls: Record<string, unknown[][]> = {};
      dataSource.transaction.mockImplementation(async (cb) => {
        const manager = {
          update: jest.fn((...args: unknown[]) => {
            managerCalls['update'] = managerCalls['update'] || [];
            managerCalls['update'].push(args);
          }),
          increment: jest.fn(),
          delete: jest.fn(),
        };
        managerCalls = {};
        return cb(manager);
      });

      await service.deleteUserData('u-1');

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteUserData('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
