import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { PlanLimitsGuard } from './plan-limits.guard';
import { Workspace } from '../../entities/workspace.entity';
import { Listing } from '../../entities/listing.entity';
import { Showing } from '../../entities/showing.entity';
import { User } from '../../entities/user.entity';
import { Plan } from '../enums/plan.enum';

describe('PlanLimitsGuard', () => {
  let guard: PlanLimitsGuard;
  let reflector: Reflector;
  let workspaceRepo: jest.Mocked<Pick<Repository<Workspace>, 'findOne'>>;
  let listingRepo: jest.Mocked<Pick<Repository<Listing>, 'count'>>;
  let showingRepo: jest.Mocked<
    Pick<Repository<Showing>, 'createQueryBuilder'>
  >;
  let userRepo: jest.Mocked<Pick<Repository<User>, 'count'>>;

  const createMockContext = (workspaceId?: string): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: workspaceId ? { workspaceId } : undefined,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    workspaceRepo = { findOne: jest.fn() };
    listingRepo = { count: jest.fn() };
    showingRepo = { createQueryBuilder: jest.fn() };
    userRepo = { count: jest.fn() };
    guard = new PlanLimitsGuard(
      reflector,
      workspaceRepo as unknown as Repository<Workspace>,
      listingRepo as unknown as Repository<Listing>,
      showingRepo as unknown as Repository<Showing>,
      userRepo as unknown as Repository<User>,
    );
  });

  it('should return true when no resource metadata is set', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(true);
  });

  it('should return true when listings count is below limit', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('listings');
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      plan: Plan.SOLO,
    } as Workspace);
    listingRepo.count.mockResolvedValue(5);

    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when listings limit reached', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('listings');
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      plan: Plan.SOLO,
    } as Workspace);
    listingRepo.count.mockResolvedValue(10);

    await expect(guard.canActivate(createMockContext('ws-1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return true for agency plan (unlimited)', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('listings');
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      plan: Plan.AGENCY,
    } as Workspace);

    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(true);
    expect(listingRepo.count).not.toHaveBeenCalled();
  });

  it('should check users count for users resource', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('users');
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      plan: Plan.SOLO,
    } as Workspace);
    userRepo.count.mockResolvedValue(1);

    await expect(guard.canActivate(createMockContext('ws-1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should check showings count with monthly window', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('showings');
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      plan: Plan.SOLO,
    } as Workspace);

    const mockQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(30),
    };
    showingRepo.createQueryBuilder.mockReturnValue(mockQb as never);

    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(true);
    expect(mockQb.andWhere).toHaveBeenCalled();
  });

  it('should return false if no workspaceId', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('listings');
    const result = await guard.canActivate(createMockContext(undefined));
    expect(result).toBe(false);
  });

  it('should return false if workspace not found', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('listings');
    workspaceRepo.findOne.mockResolvedValue(null);
    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(false);
  });

  it('should allow team plan with higher limits', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('listings');
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      plan: Plan.TEAM,
    } as Workspace);
    listingRepo.count.mockResolvedValue(49);

    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(true);
  });
});
