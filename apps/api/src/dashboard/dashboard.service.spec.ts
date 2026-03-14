import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Listing } from '../entities/listing.entity';
import { Showing } from '../entities/showing.entity';
import { Offer } from '../entities/offer.entity';
import { User } from '../entities/user.entity';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import {
  createMockRepository,
  createMockRedisCacheService,
} from '../test-utils/mocks';

describe('DashboardService', () => {
  let service: DashboardService;
  let listingRepo: ReturnType<typeof createMockRepository>;
  let showingRepo: ReturnType<typeof createMockRepository>;
  let offerRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let cacheService: ReturnType<typeof createMockRedisCacheService>;

  const workspaceId = 'ws-1';
  const cacheKey = `dashboard:summary:${workspaceId}`;

  beforeEach(async () => {
    listingRepo = createMockRepository();
    showingRepo = createMockRepository();
    offerRepo = createMockRepository();
    userRepo = createMockRepository();
    cacheService = createMockRedisCacheService();

    showingRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
    });

    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Listing), useValue: listingRepo },
        { provide: getRepositoryToken(Showing), useValue: showingRepo },
        { provide: getRepositoryToken(Offer), useValue: offerRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: RedisCacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should return cached summary when cache hit', async () => {
    const cachedSummary = {
      listings: { total: 5, active: 5, pending: 0, sold: 0 },
      showings: { upcoming: 2, completed: 0, today: 2 },
      offers: { pending: 3, accepted: 0, total: 3 },
      agents: { total: 4, active: 4 },
    };
    cacheService.get.mockResolvedValue(cachedSummary);

    const result = await service.getSummary(workspaceId);

    expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(cachedSummary);
    expect(listingRepo.count).not.toHaveBeenCalled();
  });

  it('should compute fresh summary when cache miss', async () => {
    cacheService.get.mockResolvedValue(null);
    listingRepo.count.mockResolvedValue(10);
    showingRepo.count.mockResolvedValue(2);
    offerRepo.count.mockResolvedValue(3);
    userRepo.count.mockResolvedValue(7);

    const result = await service.getSummary(workspaceId);

    expect(result).toBeDefined();
    expect(result.listings).toBeDefined();
    expect(result.showings).toBeDefined();
    expect(result.offers).toBeDefined();
    expect(result.agents).toBeDefined();
    expect(listingRepo.count).toHaveBeenCalled();
    expect(offerRepo.count).toHaveBeenCalled();
    expect(userRepo.count).toHaveBeenCalled();
  });

  it('should cache the computed result', async () => {
    cacheService.get.mockResolvedValue(null);
    listingRepo.count.mockResolvedValue(10);
    showingRepo.count.mockResolvedValue(2);
    offerRepo.count.mockResolvedValue(3);
    userRepo.count.mockResolvedValue(7);

    await service.getSummary(workspaceId);

    expect(cacheService.set).toHaveBeenCalledWith(
      cacheKey,
      expect.any(Object),
      30,
    );
  });

  it('should delete the cache key on invalidateSummary', async () => {
    await service.invalidateSummary(workspaceId);

    expect(cacheService.del).toHaveBeenCalledWith(cacheKey);
  });

  it('should not throw when invalidateSummary cache del fails', async () => {
    cacheService.del.mockRejectedValue(new Error('Redis down'));

    await expect(service.invalidateSummary(workspaceId)).resolves.not.toThrow();
  });

  it('should compute dates correctly for today showings query', async () => {
    cacheService.get.mockResolvedValue(null);
    listingRepo.count.mockResolvedValue(0);
    showingRepo.count.mockResolvedValue(0);
    offerRepo.count.mockResolvedValue(0);
    userRepo.count.mockResolvedValue(0);

    const result = await service.getSummary(workspaceId);

    expect(result.showings).toBeDefined();
    expect(typeof result.showings.today).toBe('number');
    expect(showingRepo.createQueryBuilder).toHaveBeenCalledWith('s');
  });

  it('should return correct counts in summary', async () => {
    cacheService.get.mockResolvedValue(null);
    listingRepo.count
      .mockResolvedValueOnce(20) // total
      .mockResolvedValueOnce(12) // active
      .mockResolvedValueOnce(5) // pending
      .mockResolvedValueOnce(3); // sold
    showingRepo.count
      .mockResolvedValueOnce(6) // upcoming
      .mockResolvedValueOnce(2); // completed
    showingRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(4),
    });
    offerRepo.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(5) // pending
      .mockResolvedValueOnce(3); // accepted
    userRepo.count
      .mockResolvedValueOnce(8) // total
      .mockResolvedValueOnce(7); // active

    const result = await service.getSummary(workspaceId);

    expect(result.listings.total).toBe(20);
    expect(result.listings.active).toBe(12);
    expect(result.listings.pending).toBe(5);
    expect(result.listings.sold).toBe(3);
    expect(result.showings.upcoming).toBe(6);
    expect(result.showings.completed).toBe(2);
    expect(result.showings.today).toBe(4);
    expect(result.offers.total).toBe(10);
    expect(result.offers.pending).toBe(5);
    expect(result.offers.accepted).toBe(3);
    expect(result.agents.total).toBe(8);
    expect(result.agents.active).toBe(7);
  });
});
