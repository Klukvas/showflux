import { ExecutionContext } from '@nestjs/common';
import { RequiresWorkspaceGuard } from './workspace.guard';

describe('RequiresWorkspaceGuard', () => {
  let guard: RequiresWorkspaceGuard;

  const createMockContext = (
    user?: { workspaceId?: string },
  ): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new RequiresWorkspaceGuard();
  });

  it('should return true if user has workspaceId', () => {
    const context = createMockContext({ workspaceId: 'ws-123' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false if user has no workspaceId', () => {
    const context = createMockContext({ workspaceId: undefined });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return false if no user is on the request', () => {
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });
});
