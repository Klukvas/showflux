import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkspaceService } from './workspace.service';
import { Workspace } from '../entities/workspace.entity';
import { buildWorkspace } from '../test-utils/factories';
import { createMockRepository } from '../test-utils/mocks';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let workspaceRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    workspaceRepo = createMockRepository();

    const module = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
      ],
    }).compile();

    service = module.get(WorkspaceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findById', () => {
    it('should return the workspace when found', async () => {
      const workspace = buildWorkspace({ id: 'ws-1', name: 'Test Workspace' });
      workspaceRepo.findOne.mockResolvedValue(workspace);

      const result = await service.findById('ws-1');

      expect(workspaceRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'ws-1' } }),
      );
      expect(result).toEqual(workspace);
    });

    it('should throw NotFoundException when workspace not found', async () => {
      workspaceRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateName', () => {
    it('should update and return the workspace', async () => {
      const workspace = buildWorkspace({ id: 'ws-1', name: 'Old Name' });
      const updatedWorkspace = { ...workspace, name: 'New Name' };
      workspaceRepo.findOne.mockResolvedValue(workspace);
      workspaceRepo.save.mockResolvedValue(updatedWorkspace);

      const result = await service.updateName('ws-1', 'New Name');

      expect(workspaceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException when workspace not found', async () => {
      workspaceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateName('missing-id', 'New Name'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
