import { Test } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisCacheService } from './redis-cache.service';
import { CACHE_TTL } from './redis-cache.constants';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let cache: Record<string, jest.Mock>;

  beforeEach(async () => {
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();
    service = module.get(RedisCacheService);
  });

  describe('get()', () => {
    it('should return cached value when key exists', async () => {
      cache.get.mockResolvedValue('cached-data');

      const result = await service.get<string>('my-key');

      expect(result).toBe('cached-data');
      expect(cache.get).toHaveBeenCalledWith('my-key');
    });

    it('should return undefined on cache miss', async () => {
      cache.get.mockResolvedValue(undefined);

      const result = await service.get('missing-key');

      expect(result).toBeUndefined();
    });

    it('should return undefined and log warning on error', async () => {
      const loggerSpy = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation();
      cache.get.mockRejectedValue(new Error('connection lost'));

      const result = await service.get('broken-key');

      expect(result).toBeUndefined();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('set()', () => {
    it('should call cache.set with ttl converted to milliseconds', async () => {
      cache.set.mockResolvedValue(undefined);

      await service.set('key', 'value', 120);

      expect(cache.set).toHaveBeenCalledWith('key', 'value', 120 * 1000);
    });

    it('should use default TTL when not provided', async () => {
      cache.set.mockResolvedValue(undefined);

      await service.set('key', 'value');

      expect(cache.set).toHaveBeenCalledWith(
        'key',
        'value',
        CACHE_TTL.DEFAULT * 1000,
      );
    });

    it('should swallow errors without throwing', async () => {
      const loggerSpy = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation();
      cache.set.mockRejectedValue(new Error('write failed'));

      await expect(service.set('key', 'value')).resolves.not.toThrow();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('del()', () => {
    it('should call cache.del with the key', async () => {
      cache.del.mockResolvedValue(undefined);

      await service.del('key-to-delete');

      expect(cache.del).toHaveBeenCalledWith('key-to-delete');
    });

    it('should swallow errors without throwing', async () => {
      const loggerSpy = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation();
      cache.del.mockRejectedValue(new Error('delete failed'));

      await expect(service.del('key')).resolves.not.toThrow();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('ping()', () => {
    it('should return true when redis is healthy', async () => {
      cache.set.mockResolvedValue(undefined);
      cache.get.mockResolvedValue('ok');
      cache.del.mockResolvedValue(undefined);

      const result = await service.ping();

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      cache.set.mockRejectedValue(new Error('connection refused'));

      const result = await service.ping();

      expect(result).toBe(false);
    });
  });
});
