import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (user?: { role: Role }): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should return true if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: Role.AGENT });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user has the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BROKER]);
    const context = createMockContext({ role: Role.BROKER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false if user does not have the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BROKER]);
    const context = createMockContext({ role: Role.AGENT });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return false if no user is on the request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BROKER]);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });
});
