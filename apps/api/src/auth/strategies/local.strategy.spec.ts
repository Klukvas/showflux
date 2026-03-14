import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { buildUser } from '../../test-utils/factories';

function createMockAuthService() {
  return {
    validateUser: jest.fn(),
  };
}

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    authService = createMockAuthService();
    strategy = new LocalStrategy(authService as unknown as AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the user for valid credentials', async () => {
    const user = buildUser({ email: 'test@example.com' });
    authService.validateUser.mockResolvedValue(user);

    const result = await strategy.validate('test@example.com', 'correct-pass');

    expect(authService.validateUser).toHaveBeenCalledWith(
      'test@example.com',
      'correct-pass',
    );
    expect(result).toEqual(user);
  });

  it('should throw UnauthorizedException for invalid credentials', async () => {
    authService.validateUser.mockResolvedValue(null);

    await expect(
      strategy.validate('test@example.com', 'wrong-pass'),
    ).rejects.toThrow(UnauthorizedException);

    expect(authService.validateUser).toHaveBeenCalledWith(
      'test@example.com',
      'wrong-pass',
    );
  });
});
