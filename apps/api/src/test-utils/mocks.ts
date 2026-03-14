export function createMockRepository() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn().mockImplementation((entity: unknown) => entity),
    update: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      getOne: jest.fn(),
      getCount: jest.fn(),
    })),
  };
}

export function createMockDataSource() {
  return {
    transaction: jest.fn(
      async (cb: (manager: ReturnType<typeof createMockTransactionManager>) => Promise<unknown>) => {
        const manager = createMockTransactionManager();
        return cb(manager);
      },
    ),
  };
}

export function createMockTransactionManager() {
  return {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((entity: unknown) => entity),
    create: jest.fn().mockImplementation((_Entity: unknown, data: unknown) => data),
    update: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      getOne: jest.fn(),
    })),
  };
}

export function createMockJwtService() {
  return {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
    signAsync: jest.fn().mockResolvedValue('mock-token'),
  };
}

export function createMockConfigService(
  defaults: Record<string, unknown> = {},
) {
  const config: Record<string, unknown> = {
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_EXPIRATION: '30d',
    NODE_ENV: 'test',
    ...defaults,
  };
  return {
    get: jest.fn((key: string, fallback?: unknown) => config[key] ?? fallback),
    getOrThrow: jest.fn((key: string) => {
      if (config[key] === undefined) {
        throw new Error(`Missing config: ${key}`);
      }
      return config[key];
    }),
  };
}

export function createMockRedisCacheService() {
  return {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue(true),
  };
}

export function createMockActivityService() {
  return {
    log: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 50 }),
  };
}

export function createMockDashboardService() {
  return {
    getSummary: jest.fn().mockResolvedValue({
      listings: { total: 0, active: 0, pending: 0, sold: 0 },
      showings: { upcoming: 0, completed: 0, today: 0 },
      offers: { pending: 0, accepted: 0, total: 0 },
      agents: { total: 0, active: 0 },
    }),
    invalidateSummary: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockCacheManager() {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn(async (key: string) => store.get(key)),
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    store,
  };
}
