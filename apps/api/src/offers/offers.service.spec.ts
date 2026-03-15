import { Test } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OffersService } from './offers.service';
import { Offer } from '../entities/offer.entity';
import { Listing } from '../entities/listing.entity';
import { ActivityService } from '../activity/activity.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { buildOffer, buildListing } from '../test-utils/factories';
import {
  createMockRepository,
  createMockActivityService,
  createMockDashboardService,
} from '../test-utils/mocks';
import { OfferStatus } from '../common/enums/offer-status.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { Role } from '../common/enums/role.enum';

describe('OffersService', () => {
  let service: OffersService;
  let offerRepo: ReturnType<typeof createMockRepository>;
  let listingRepo: ReturnType<typeof createMockRepository>;
  let dataSource: { transaction: jest.Mock };
  let activityService: ReturnType<typeof createMockActivityService>;
  let dashboardService: ReturnType<typeof createMockDashboardService>;

  beforeEach(async () => {
    offerRepo = createMockRepository();
    listingRepo = createMockRepository();
    activityService = createMockActivityService();
    dashboardService = createMockDashboardService();

    dataSource = {
      transaction: jest.fn(async (cb) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce(
              buildOffer({
                id: 'o1',
                workspaceId: 'ws1',
                listingId: 'l1',
                status: OfferStatus.PENDING,
              }),
            )
            .mockResolvedValueOnce(null),
          save: jest.fn().mockImplementation((v) => ({
            ...v,
            id: v.id ?? 'offer-1',
          })),
          create: jest
            .fn()
            .mockImplementation((_Entity: unknown, data: unknown) => data),
          createQueryBuilder: jest.fn(() => ({
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          })),
        };
        return cb(manager);
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: getRepositoryToken(Offer), useValue: offerRepo },
        { provide: getRepositoryToken(Listing), useValue: listingRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: ActivityService, useValue: activityService },
        { provide: DashboardService, useValue: dashboardService },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── findAll ───────────────────────────────────────────────────────────

  it('findAll returns paginated offers', async () => {
    const offers = [buildOffer({ id: 'o1' }), buildOffer({ id: 'o2' })];
    offerRepo.findAndCount.mockResolvedValue([offers, 2]);

    const result = await service.findAll('ws1', { page: 1, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  // ── findById ──────────────────────────────────────────────────────────

  it('findById returns offer with relations', async () => {
    const offer = buildOffer({ id: 'o1', workspaceId: 'ws1' });
    offerRepo.findOne.mockResolvedValue(offer);

    const result = await service.findById('o1', 'ws1');

    expect(result).toEqual(offer);
    expect(offerRepo.findOne).toHaveBeenCalled();
  });

  it('findById throws NotFoundException when offer not found', async () => {
    offerRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('missing', 'ws1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ── create ────────────────────────────────────────────────────────────

  it('create validates listing exists', async () => {
    listingRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        { listingId: 'l-missing', amount: 300_000 } as any,
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
        { listingId: 'l1', amount: 300_000 } as any,
        'ws1',
        'agent1',
      ),
    ).rejects.toThrow();
  });

  it('create saves offer with submittedAt timestamp', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.ACTIVE,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    const saved = buildOffer({
      id: 'o1',
      listingId: 'l1',
      submittedAt: new Date(),
    });
    offerRepo.create.mockReturnValue(saved);
    offerRepo.save.mockResolvedValue(saved);

    const result = await service.create(
      { listingId: 'l1', amount: 300_000 } as any,
      'ws1',
      'agent1',
    );

    expect(result).toBeDefined();
    expect(offerRepo.save).toHaveBeenCalled();
  });

  it('create logs activity', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.ACTIVE,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    const saved = buildOffer({ id: 'o1' });
    offerRepo.create.mockReturnValue(saved);
    offerRepo.save.mockResolvedValue(saved);

    await service.create(
      { listingId: 'l1', amount: 300_000 } as any,
      'ws1',
      'agent1',
    );

    expect(activityService.log).toHaveBeenCalled();
  });

  it('create converts expirationDate string to Date when provided', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.ACTIVE,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    const saved = buildOffer({ id: 'o1' });
    offerRepo.create.mockReturnValue(saved);
    offerRepo.save.mockResolvedValue(saved);

    await service.create(
      {
        listingId: 'l1',
        amount: 300_000,
        expirationDate: '2026-12-31T23:59:59.000Z',
      } as any,
      'ws1',
      'agent1',
    );

    expect(offerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        expirationDate: expect.any(Date),
      }),
    );
  });

  it('create sets expirationDate to null when not provided', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.ACTIVE,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    const saved = buildOffer({ id: 'o1' });
    offerRepo.create.mockReturnValue(saved);
    offerRepo.save.mockResolvedValue(saved);

    await service.create(
      { listingId: 'l1', amount: 300_000 } as any,
      'ws1',
      'agent1',
    );

    expect(offerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        expirationDate: null,
      }),
    );
  });

  it('create invalidates dashboard cache', async () => {
    const listing = buildListing({
      id: 'l1',
      status: ListingStatus.ACTIVE,
      workspaceId: 'ws1',
    });
    listingRepo.findOne.mockResolvedValue(listing);

    const saved = buildOffer({ id: 'o1' });
    offerRepo.create.mockReturnValue(saved);
    offerRepo.save.mockResolvedValue(saved);

    await service.create(
      { listingId: 'l1', amount: 300_000 } as any,
      'ws1',
      'agent1',
    );

    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });

  // ── update ────────────────────────────────────────────────────────────

  it('update (non-accept) merges dto and saves', async () => {
    const existing = buildOffer({
      id: 'o1',
      workspaceId: 'ws1',
      status: OfferStatus.PENDING,
    });
    offerRepo.findOne.mockResolvedValue(existing);
    offerRepo.save.mockImplementation((o) => Promise.resolve(o));

    await service.update(
      'o1',
      { notes: 'counter' } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    expect(offerRepo.save).toHaveBeenCalled();
  });

  it('update logs OFFER_REJECTED for rejected status', async () => {
    const existing = buildOffer({
      id: 'o1',
      workspaceId: 'ws1',
      status: OfferStatus.PENDING,
    });
    offerRepo.findOne.mockResolvedValue(existing);
    offerRepo.save.mockImplementation((o) => Promise.resolve(o));

    await service.update(
      'o1',
      { status: OfferStatus.REJECTED } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    expect(activityService.log).toHaveBeenCalled();
  });

  it('update with ACCEPTED status triggers acceptOffer transaction', async () => {
    const existing = buildOffer({
      id: 'o1',
      workspaceId: 'ws1',
      listingId: 'l1',
      status: OfferStatus.PENDING,
    });
    offerRepo.findOne.mockResolvedValue(existing);

    await service.update(
      'o1',
      { status: OfferStatus.ACCEPTED } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('update logs OFFER_UPDATED for non-rejected status changes', async () => {
    const existing = buildOffer({
      id: 'o1',
      workspaceId: 'ws1',
      status: OfferStatus.SUBMITTED,
    });
    offerRepo.findOne.mockResolvedValue(existing);
    offerRepo.save.mockImplementation((o) => Promise.resolve(o));

    await service.update(
      'o1',
      { status: OfferStatus.COUNTERED } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    expect(activityService.log).toHaveBeenCalled();
  });

  it('update with expirationDate converts string to Date', async () => {
    const existing = buildOffer({
      id: 'o1',
      workspaceId: 'ws1',
      status: OfferStatus.PENDING,
    });
    offerRepo.findOne.mockResolvedValue(existing);
    offerRepo.save.mockImplementation((o) => Promise.resolve(o));

    const expirationDate = '2026-12-31T23:59:59.000Z';
    await service.update(
      'o1',
      { expirationDate } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    const savedArg = offerRepo.save.mock.calls[0][0];
    expect(savedArg.expirationDate).toBeInstanceOf(Date);
    expect(savedArg.expirationDate.toISOString()).toBe(expirationDate);
  });

  it("throws ForbiddenException when agent edits another agent's offer", async () => {
    const existing = buildOffer({
      id: 'o1',
      workspaceId: 'ws1',
      agentId: 'other-agent',
      status: OfferStatus.PENDING,
    });
    offerRepo.findOne.mockResolvedValue(existing);

    await expect(
      service.update(
        'o1',
        { notes: 'edited' } as any,
        'ws1',
        'agent1',
        Role.AGENT,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows agent to edit own offer', async () => {
    const existing = buildOffer({
      id: 'o1',
      workspaceId: 'ws1',
      agentId: 'agent1',
      status: OfferStatus.PENDING,
    });
    offerRepo.findOne.mockResolvedValue(existing);
    offerRepo.save.mockImplementation((o) => Promise.resolve(o));

    const result = await service.update(
      'o1',
      { notes: 'my edit' } as any,
      'ws1',
      'agent1',
      Role.AGENT,
    );

    expect(result).toBeDefined();
    expect(offerRepo.save).toHaveBeenCalled();
  });

  it('throws ForbiddenException when agent tries to accept an offer', async () => {
    await expect(
      service.update(
        'o1',
        { status: OfferStatus.ACCEPTED } as any,
        'ws1',
        'agent1',
        Role.AGENT,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // ── acceptOffer (via update) ──────────────────────────────────────────

  it('acceptOffer succeeds atomically when no existing accepted offer', async () => {
    const existing = buildOffer({
      id: 'o1',
      workspaceId: 'ws1',
      listingId: 'l1',
      status: OfferStatus.PENDING,
    });
    offerRepo.findOne.mockResolvedValue(existing);

    const result = await service.update(
      'o1',
      { status: OfferStatus.ACCEPTED } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('acceptOffer throws NotFoundException when offer not found in transaction', async () => {
    dataSource.transaction.mockImplementation(async (cb) => {
      const manager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
        create: jest
          .fn()
          .mockImplementation((_Entity: unknown, data: unknown) => data),
      };
      return cb(manager);
    });

    await expect(
      service.update(
        'missing',
        { status: OfferStatus.ACCEPTED } as any,
        'ws1',
        'user1',
        Role.BROKER,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('acceptOffer converts expirationDate string to Date', async () => {
    const expirationDate = '2026-12-31T23:59:59.000Z';

    dataSource.transaction.mockImplementation(async (cb) => {
      const manager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(
            buildOffer({
              id: 'o1',
              workspaceId: 'ws1',
              listingId: 'l1',
              status: OfferStatus.PENDING,
            }),
          )
          .mockResolvedValueOnce(null),
        save: jest.fn().mockImplementation((v) => ({
          ...v,
          id: v.id ?? 'offer-1',
        })),
        create: jest
          .fn()
          .mockImplementation((_Entity: unknown, data: unknown) => data),
      };
      return cb(manager);
    });

    const result = await service.update(
      'o1',
      { status: OfferStatus.ACCEPTED, expirationDate } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    expect(result.expirationDate).toBeInstanceOf(Date);
    expect(result.expirationDate!.toISOString()).toBe(expirationDate);
  });

  it('acceptOffer throws ConflictException if another offer already accepted', async () => {
    const existing = buildOffer({
      id: 'o1',
      workspaceId: 'ws1',
      listingId: 'l1',
      status: OfferStatus.PENDING,
    });
    offerRepo.findOne.mockResolvedValue(existing);

    dataSource.transaction.mockImplementation(async (cb) => {
      const manager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(
            buildOffer({
              id: 'o1',
              workspaceId: 'ws1',
              listingId: 'l1',
              status: OfferStatus.PENDING,
            }),
          )
          .mockResolvedValueOnce(
            buildOffer({ id: 'o-other', status: OfferStatus.ACCEPTED }),
          ),
        save: jest.fn(),
        create: jest
          .fn()
          .mockImplementation((_Entity: unknown, data: unknown) => data),
      };
      return cb(manager);
    });

    await expect(
      service.update(
        'o1',
        { status: OfferStatus.ACCEPTED } as any,
        'ws1',
        'user1',
        Role.BROKER,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('acceptOffer logs activity when userId is provided', async () => {
    dataSource.transaction.mockImplementation(async (cb) => {
      const manager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(
            buildOffer({
              id: 'o1',
              workspaceId: 'ws1',
              listingId: 'l1',
              status: OfferStatus.PENDING,
            }),
          )
          .mockResolvedValueOnce(null),
        save: jest.fn().mockImplementation((v) => ({
          ...v,
          id: v.id ?? 'offer-1',
        })),
        create: jest
          .fn()
          .mockImplementation((_Entity: unknown, data: unknown) => data),
      };
      return cb(manager);
    });

    await service.update(
      'o1',
      { status: OfferStatus.ACCEPTED } as any,
      'ws1',
      'user1',
      Role.BROKER,
    );

    expect(activityService.log).toHaveBeenCalled();
  });

  // ── remove ────────────────────────────────────────────────────────────

  it('remove deletes offer and invalidates caches', async () => {
    const existing = buildOffer({ id: 'o1', workspaceId: 'ws1' });
    offerRepo.findOne.mockResolvedValue(existing);
    offerRepo.remove.mockResolvedValue(existing);

    await service.remove('o1', 'ws1');

    expect(offerRepo.remove).toHaveBeenCalledWith(existing);
    expect(dashboardService.invalidateSummary).toHaveBeenCalledWith('ws1');
  });
});
