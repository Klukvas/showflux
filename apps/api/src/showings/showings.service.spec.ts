import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ShowingsService } from './showings.service';
import { Showing } from '../entities/showing.entity';
import { Listing } from '../entities/listing.entity';
import { ActivityService } from '../activity/activity.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { buildShowing, buildListing } from '../test-utils/factories';
import {
  createMockRepository,
  createMockActivityService,
  createMockDashboardService,
} from '../test-utils/mocks';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ShowingStatus } from '../common/enums/showing-status.enum';

describe('ShowingsService', () => {
  let service: ShowingsService;
  let showingRepo: ReturnType<typeof createMockRepository>;
  let listingRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let activityService: ReturnType<typeof createMockActivityService>;
  let dashboardService: ReturnType<typeof createMockDashboardService>;

  beforeEach(async () => {
    showingRepo = createMockRepository();
    listingRepo = createMockRepository();
    activityService = createMockActivityService();
    dashboardService = createMockDashboardService();

    dataSource = {
      transaction: jest.fn(async (cb) => {
        const manager = {
          createQueryBuilder: jest.fn(() => ({
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          })),
          create: jest.fn().mockImplementation((_E, data) => data),
          save: jest
            .fn()
            .mockImplementation((v) => ({ ...v, id: v.id ?? 'showing-1' })),
        };
        return cb(manager);
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ShowingsService,
        { provide: getRepositoryToken(Showing), useValue: showingRepo },
        { provide: getRepositoryToken(Listing), useValue: listingRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: ActivityService, useValue: activityService },
        { provide: DashboardService, useValue: dashboardService },
      ],
    }).compile();

    service = module.get<ShowingsService>(ShowingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── findAll ───────────────────────────────────────────────────────────

  it('findAll returns paginated showings', async () => {
    const showings = [buildShowing({ id: 's1' }), buildShowing({ id: 's2' })];
    showingRepo.findAndCount.mockResolvedValue([showings, 2]);

    const result = await service.findAll('ws1', { page: 1, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('findAll applies date range filter with both from and to', async () => {
    showingRepo.findAndCount.mockResolvedValue([[], 0]);

    const from = '2026-01-01';
    const to = '2026-01-31';

    await service.findAll('ws1', { page: 1, limit: 10, from, to });

    expect(showingRepo.findAndCount).toHaveBeenCalled();
  });

  it('findAll applies only from filter (MoreThanOrEqual)', async () => {
    showingRepo.findAndCount.mockResolvedValue([[], 0]);

    const from = '2026-01-01';

    await service.findAll('ws1', { page: 1, limit: 10, from });

    const callArgs = showingRepo.findAndCount.mock.calls[0][0];
    expect(callArgs.where.scheduledAt).toBeDefined();
  });

  it('findAll applies only to filter (LessThanOrEqual)', async () => {
    showingRepo.findAndCount.mockResolvedValue([[], 0]);

    const to = '2026-01-31';

    await service.findAll('ws1', { page: 1, limit: 10, to });

    const callArgs = showingRepo.findAndCount.mock.calls[0][0];
    expect(callArgs.where.scheduledAt).toBeDefined();
  });

  // ── findById ──────────────────────────────────────────────────────────

  it('findById returns showing with relations', async () => {
    const showing = buildShowing({ id: 's1', workspaceId: 'ws1' });
    showingRepo.findOne.mockResolvedValue(showing);

    const result = await service.findById('s1', 'ws1');

    expect(result).toEqual(showing);
    expect(showingRepo.findOne).toHaveBeenCalled();
  });

  it('findById throws NotFoundException when showing not found', async () => {
    showingRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('missing', 'ws1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ── create ────────────────────────────────────────────────────────────

  it('create validates listing exists', async () => {
    listingRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          listingId: 'l-missing',
          scheduledAt: new Date().toISOString(),
        } as any,
        'ws1',
        'agent1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('create throws if listing is not active', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.SOLD,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    await expect(
      service.create(
        { listingId: 'l1', scheduledAt: new Date().toISOString() } as any,
        'ws1',
        'agent1',
      ),
    ).rejects.toThrow();
  });

  it('create throws ConflictException on overlap', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.ACTIVE,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    dataSource.transaction.mockImplementation(async (cb) => {
      const manager = {
        createQueryBuilder: jest.fn(() => ({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(buildShowing({ id: 'overlap' })),
        })),
        create: jest.fn(),
        save: jest.fn(),
      };
      return cb(manager);
    });

    await expect(
      service.create(
        { listingId: 'l1', scheduledAt: new Date().toISOString() } as any,
        'ws1',
        'agent1',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('create succeeds with no overlap', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.ACTIVE,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    const result = await service.create(
      { listingId: 'l1', scheduledAt: new Date().toISOString() } as any,
      'ws1',
      'agent1',
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('create logs activity', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.ACTIVE,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    await service.create(
      { listingId: 'l1', scheduledAt: new Date().toISOString() } as any,
      'ws1',
      'agent1',
    );

    expect(activityService.log).toHaveBeenCalled();
  });

  it('create invalidates dashboard cache', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.ACTIVE,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    await service.create(
      { listingId: 'l1', scheduledAt: new Date().toISOString() } as any,
      'ws1',
      'agent1',
    );

    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });

  // ── update ────────────────────────────────────────────────────────────

  it('update merges dto and saves', async () => {
    const existing = buildShowing({ id: 's1', workspaceId: 'ws1' });
    showingRepo.findOne.mockResolvedValue(existing);
    showingRepo.save.mockImplementation((s) => Promise.resolve(s));

    await service.update('s1', { notes: 'updated' } as any, 'ws1');

    expect(showingRepo.save).toHaveBeenCalled();
  });

  it('update converts scheduledAt string to Date', async () => {
    const existing = buildShowing({ id: 's1', workspaceId: 'ws1' });
    showingRepo.findOne.mockResolvedValue(existing);
    showingRepo.save.mockImplementation((s) => Promise.resolve(s));

    const isoDate = '2026-06-15T10:00:00.000Z';
    await service.update('s1', { scheduledAt: isoDate } as any, 'ws1');

    const savedArg = showingRepo.save.mock.calls[0][0];
    expect(savedArg.scheduledAt).toBeInstanceOf(Date);
  });

  it('update logs SHOWING_COMPLETED when status is completed', async () => {
    const existing = buildShowing({ id: 's1', workspaceId: 'ws1' });
    showingRepo.findOne.mockResolvedValue(existing);
    showingRepo.save.mockImplementation((s) => Promise.resolve(s));

    await service.update(
      's1',
      { status: ShowingStatus.COMPLETED } as any,
      'ws1',
      'user1',
    );

    expect(activityService.log).toHaveBeenCalled();
  });

  it('update logs SHOWING_UPDATED for non-completed status', async () => {
    const existing = buildShowing({ id: 's1', workspaceId: 'ws1' });
    showingRepo.findOne.mockResolvedValue(existing);
    showingRepo.save.mockImplementation((s) => Promise.resolve(s));

    await service.update(
      's1',
      { status: ShowingStatus.CANCELLED } as any,
      'ws1',
      'user1',
    );

    expect(activityService.log).toHaveBeenCalled();
  });

  it('update without userId does not log activity', async () => {
    const existing = buildShowing({ id: 's1', workspaceId: 'ws1' });
    showingRepo.findOne.mockResolvedValue(existing);
    showingRepo.save.mockImplementation((s) => Promise.resolve(s));

    await service.update('s1', { notes: 'changed' } as any, 'ws1');

    expect(activityService.log).not.toHaveBeenCalled();
  });

  // ── remove ────────────────────────────────────────────────────────────

  it('remove deletes showing and invalidates dashboard', async () => {
    const existing = buildShowing({ id: 's1', workspaceId: 'ws1' });
    showingRepo.findOne.mockResolvedValue(existing);
    showingRepo.remove.mockResolvedValue(existing);

    await service.remove('s1', 'ws1');

    expect(showingRepo.remove).toHaveBeenCalledWith(existing);
    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });
});
