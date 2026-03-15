import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListingsService } from './listings.service';
import { Listing } from '../entities/listing.entity';
import { ActivityService } from '../activity/activity.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { buildListing } from '../test-utils/factories';
import {
  createMockRepository,
  createMockRedisCacheService,
  createMockActivityService,
  createMockDashboardService,
} from '../test-utils/mocks';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { Role } from '../common/enums/role.enum';

describe('ListingsService', () => {
  let service: ListingsService;
  let listingRepo: ReturnType<typeof createMockRepository>;
  let activityService: ReturnType<typeof createMockActivityService>;
  let dashboardService: ReturnType<typeof createMockDashboardService>;
  let cacheService: ReturnType<typeof createMockRedisCacheService>;

  beforeEach(async () => {
    listingRepo = createMockRepository();
    activityService = createMockActivityService();
    dashboardService = createMockDashboardService();
    cacheService = createMockRedisCacheService();

    const module = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: getRepositoryToken(Listing), useValue: listingRepo },
        { provide: ActivityService, useValue: activityService },
        { provide: DashboardService, useValue: dashboardService },
        { provide: RedisCacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── findAll ───────────────────────────────────────────────────────────

  it('findAll returns paginated listings', async () => {
    const listings = [buildListing({ id: 'l1' }), buildListing({ id: 'l2' })];
    listingRepo.findAndCount.mockResolvedValue([listings, 2]);

    const result = await service.findAll('ws1', { page: 1, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(listingRepo.findAndCount).toHaveBeenCalled();
  });

  it('findAll applies status filter', async () => {
    listingRepo.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll('ws1', {
      page: 1,
      limit: 10,
      status: ListingStatus.ACTIVE,
    });

    const callArgs = listingRepo.findAndCount.mock.calls[0][0];
    expect(callArgs.where).toEqual(
      expect.objectContaining({ status: ListingStatus.ACTIVE }),
    );
  });

  it('findAll applies price range filter', async () => {
    listingRepo.findAndCount.mockResolvedValue([[], 0]);

    // min + max
    await service.findAll('ws1', {
      page: 1,
      limit: 10,
      minPrice: 100_000,
      maxPrice: 500_000,
    });

    expect(listingRepo.findAndCount).toHaveBeenCalled();

    // min only
    listingRepo.findAndCount.mockClear();
    await service.findAll('ws1', { page: 1, limit: 10, minPrice: 100_000 });
    expect(listingRepo.findAndCount).toHaveBeenCalled();

    // max only
    listingRepo.findAndCount.mockClear();
    await service.findAll('ws1', { page: 1, limit: 10, maxPrice: 500_000 });
    expect(listingRepo.findAndCount).toHaveBeenCalled();
  });

  it('findAll clamps page and limit values', async () => {
    listingRepo.findAndCount.mockResolvedValue([[], 0]);

    await service.findAll('ws1', { page: -1, limit: 9999 });

    const callArgs = listingRepo.findAndCount.mock.calls[0][0];
    expect(callArgs.skip).toBeGreaterThanOrEqual(0);
    expect(callArgs.take).toBeLessThanOrEqual(100);
  });

  // ── findById ──────────────────────────────────────────────────────────

  it('findById returns cached listing when workspaceId matches', async () => {
    const listing = buildListing({ id: 'l1', workspaceId: 'ws1' });
    cacheService.get.mockResolvedValue(listing);

    const result = await service.findById('l1', 'ws1');

    expect(cacheService.get).toHaveBeenCalledWith('listing:l1');
    expect(listingRepo.findOne).not.toHaveBeenCalled();
    expect(result).toEqual(listing);
  });

  it('findById fetches from repo and caches', async () => {
    const listing = buildListing({ id: 'l1', workspaceId: 'ws1' });
    cacheService.get.mockResolvedValue(null);
    listingRepo.findOne.mockResolvedValue(listing);

    const result = await service.findById('l1', 'ws1');

    expect(listingRepo.findOne).toHaveBeenCalled();
    expect(cacheService.set).toHaveBeenCalledWith('listing:l1', listing, 300);
    expect(result).toEqual(listing);
  });

  it('findById throws NotFoundException when listing not found', async () => {
    cacheService.get.mockResolvedValue(null);
    listingRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('missing', 'ws1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findById ignores cache when workspaceId does not match', async () => {
    const listing = buildListing({ id: 'l1', workspaceId: 'ws-other' });
    cacheService.get.mockResolvedValue(listing);
    listingRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('l1', 'ws1')).rejects.toThrow(
      NotFoundException,
    );
    expect(listingRepo.findOne).toHaveBeenCalled();
  });

  // ── create ────────────────────────────────────────────────────────────

  it('create saves listing and logs activity', async () => {
    const dto = { title: 'Nice House', price: 300_000 };
    const saved = buildListing({ id: 'l1', ...dto, workspaceId: 'ws1' });
    listingRepo.create.mockReturnValue(saved);
    listingRepo.save.mockResolvedValue(saved);

    const result = await service.create(dto as any, 'ws1', 'agent1');

    expect(listingRepo.save).toHaveBeenCalled();
    expect(activityService.log).toHaveBeenCalled();
    expect(result).toEqual(saved);
  });

  it('create invalidates dashboard cache', async () => {
    const saved = buildListing({ id: 'l1', workspaceId: 'ws1' });
    listingRepo.create.mockReturnValue(saved);
    listingRepo.save.mockResolvedValue(saved);

    await service.create({ title: 'X' } as any, 'ws1', 'agent1');

    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });

  // ── update ────────────────────────────────────────────────────────────

  it('update finds, merges, and saves listing', async () => {
    const existing = buildListing({
      id: 'l1',
      workspaceId: 'ws1',
      title: 'Old',
    });
    listingRepo.findOne.mockResolvedValue(existing);
    listingRepo.save.mockImplementation((l) => Promise.resolve(l));

    const result = await service.update(
      'l1',
      { title: 'New' } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    expect(listingRepo.save).toHaveBeenCalled();
    expect(activityService.log).toHaveBeenCalled();
  });

  it('update invalidates cache and dashboard', async () => {
    const existing = buildListing({ id: 'l1', workspaceId: 'ws1' });
    listingRepo.findOne.mockResolvedValue(existing);
    listingRepo.save.mockImplementation((l) => Promise.resolve(l));

    await service.update(
      'l1',
      { title: 'New' } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    expect(cacheService.del).toHaveBeenCalledWith('listing:l1');
    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });

  it("throws ForbiddenException when agent edits another agent's listing", async () => {
    const existing = buildListing({
      id: 'l1',
      workspaceId: 'ws1',
      listingAgentId: 'other-agent',
    });
    cacheService.get.mockResolvedValue(null);
    listingRepo.findOne.mockResolvedValue(existing);

    await expect(
      service.update(
        'l1',
        { title: 'Hijack' } as any,
        'ws1',
        'agent1',
        Role.AGENT,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows agent to edit own listing', async () => {
    const existing = buildListing({
      id: 'l1',
      workspaceId: 'ws1',
      listingAgentId: 'agent1',
    });
    cacheService.get.mockResolvedValue(null);
    listingRepo.findOne.mockResolvedValue(existing);
    listingRepo.save.mockImplementation((l) => Promise.resolve(l));

    await expect(
      service.update(
        'l1',
        { title: 'My Update' } as any,
        'ws1',
        'agent1',
        Role.AGENT,
      ),
    ).resolves.not.toThrow();
  });

  // ── remove ────────────────────────────────────────────────────────────

  it('remove deletes listing and invalidates caches', async () => {
    const existing = buildListing({ id: 'l1', workspaceId: 'ws1' });
    listingRepo.findOne.mockResolvedValue(existing);
    listingRepo.remove.mockResolvedValue(existing);

    await service.remove('l1', 'ws1');

    expect(listingRepo.remove).toHaveBeenCalledWith(existing);
    expect(cacheService.del).toHaveBeenCalledWith('listing:l1');
    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });

  it('remove activity logging does not break on error', async () => {
    const existing = buildListing({ id: 'l1', workspaceId: 'ws1' });
    listingRepo.findOne.mockResolvedValue(existing);
    listingRepo.remove.mockResolvedValue(existing);
    activityService.log.mockRejectedValue(new Error('activity fail'));

    await expect(service.remove('l1', 'ws1')).resolves.not.toThrow();
  });

  it('remove with userId logs LISTING_DELETED activity', async () => {
    const existing = buildListing({
      id: 'l1',
      workspaceId: 'ws1',
      address: '456 Oak Ave',
    });
    cacheService.get.mockResolvedValue(null);
    listingRepo.findOne.mockResolvedValue(existing);
    listingRepo.remove.mockResolvedValue(existing);

    await service.remove('l1', 'ws1', 'user1');

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws1',
        userId: 'user1',
        entityType: 'listing',
        entityId: 'l1',
      }),
    );
    expect(cacheService.del).toHaveBeenCalledWith('listing:l1');
    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });

  it('remove without userId does not log activity', async () => {
    const existing = buildListing({ id: 'l1', workspaceId: 'ws1' });
    cacheService.get.mockResolvedValue(null);
    listingRepo.findOne.mockResolvedValue(existing);
    listingRepo.remove.mockResolvedValue(existing);

    await service.remove('l1', 'ws1');

    expect(activityService.log).not.toHaveBeenCalled();
  });
});
