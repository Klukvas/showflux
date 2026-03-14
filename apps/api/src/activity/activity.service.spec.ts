import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityService } from './activity.service';
import { Activity } from '../entities/activity.entity';
import { ActivityAction } from '../common/enums/activity-action.enum';
import { buildActivity } from '../test-utils/factories';
import { createMockRepository } from '../test-utils/mocks';

describe('ActivityService', () => {
  let service: ActivityService;
  let activityRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    activityRepo = createMockRepository();

    const module = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: getRepositoryToken(Activity), useValue: activityRepo },
      ],
    }).compile();

    service = module.get(ActivityService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('log', () => {
    it('should create and save an activity', async () => {
      const params = {
        workspaceId: 'ws-1',
        userId: 'user-1',
        action: ActivityAction.INVITE_SENT,
        entityType: 'invite',
        entityId: 'inv-1',
        metadata: { email: 'test@example.com' },
      };
      const activity = buildActivity(params);
      activityRepo.create.mockReturnValue(activity);
      activityRepo.save.mockResolvedValue(activity);

      await service.log(params);

      expect(activityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws-1',
          userId: 'user-1',
          action: ActivityAction.INVITE_SENT,
          metadata: { email: 'test@example.com' },
        }),
      );
      expect(activityRepo.save).toHaveBeenCalledWith(activity);
    });

    it('should set metadata to null if undefined', async () => {
      const params = {
        workspaceId: 'ws-1',
        userId: 'user-1',
        action: ActivityAction.INVITE_SENT,
        entityType: 'invite',
        entityId: 'inv-1',
      };
      const activity = buildActivity({ ...params, metadata: null });
      activityRepo.create.mockReturnValue(activity);
      activityRepo.save.mockResolvedValue(activity);

      await service.log(params);

      expect(activityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: null }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated activities', async () => {
      const activities = [buildActivity(), buildActivity()];
      activityRepo.findAndCount.mockResolvedValue([activities, 2]);

      const result = await service.findAll('ws-1', 1, 10);

      expect(activityRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1' },
          skip: 0,
          take: 10,
          relations: expect.arrayContaining(['user']),
        }),
      );
      expect(result).toEqual({
        data: activities,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should clamp page and limit to safe values', async () => {
      activityRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll('ws-1', -1, 1000);

      expect(activityRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 100,
        }),
      );
    });

    it('should use default page=1 and limit=50 when not provided', async () => {
      activityRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll('ws-1');

      expect(activityRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        }),
      );
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 50 });
    });

    it('should clamp limit to minimum 1 when limit is 0 or negative', async () => {
      activityRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll('ws-1', 1, 0);

      expect(activityRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        }),
      );
      expect(result.limit).toBe(1);
    });

    it('should correctly compute skip for page > 1', async () => {
      activityRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll('ws-1', 3, 10);

      expect(activityRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });
  });
});
