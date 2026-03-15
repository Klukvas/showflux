import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ActiveSubscriptionGuard } from './active-subscription.guard';
import { Workspace } from '../../entities/workspace.entity';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

describe('ActiveSubscriptionGuard', () => {
  let guard: ActiveSubscriptionGuard;
  let workspaceRepo: jest.Mocked<Pick<Repository<Workspace>, 'findOne'>>;

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
    workspaceRepo = { findOne: jest.fn() };
    guard = new ActiveSubscriptionGuard(
      workspaceRepo as unknown as Repository<Workspace>,
    );
  });

  it('should return true for trialing workspace', async () => {
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      subscriptionStatus: SubscriptionStatus.TRIALING,
    } as Workspace);

    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(true);
  });

  it('should return true for active workspace', async () => {
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    } as Workspace);

    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(true);
  });

  it('should return true for past_due workspace (grace period)', async () => {
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      subscriptionStatus: SubscriptionStatus.PAST_DUE,
    } as Workspace);

    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException for canceled workspace', async () => {
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      subscriptionStatus: SubscriptionStatus.CANCELED,
    } as Workspace);

    await expect(guard.canActivate(createMockContext('ws-1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException for paused workspace', async () => {
    workspaceRepo.findOne.mockResolvedValue({
      id: 'ws-1',
      subscriptionStatus: SubscriptionStatus.PAUSED,
    } as Workspace);

    await expect(guard.canActivate(createMockContext('ws-1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return false if no workspaceId on request', async () => {
    const result = await guard.canActivate(createMockContext(undefined));
    expect(result).toBe(false);
  });

  it('should return false if workspace not found', async () => {
    workspaceRepo.findOne.mockResolvedValue(null);

    const result = await guard.canActivate(createMockContext('ws-1'));
    expect(result).toBe(false);
  });
});
