import Redis from 'ioredis';
import { TokenRevocationRedisRepository } from '../token-revocation-redis.repository';

describe('TokenRevocationRedisRepository', () => {
  let repository: TokenRevocationRedisRepository;
  let redis: jest.Mocked<Pick<Redis, 'set' | 'exists'>>;

  beforeEach(() => {
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      exists: jest.fn().mockResolvedValue(0),
    } as jest.Mocked<Pick<Redis, 'set' | 'exists'>>;

    repository = new TokenRevocationRedisRepository(
      redis as jest.Mocked<Redis>,
    );
  });

  it('should store revoked token with TTL', async () => {
    await repository.revoke('abc123hash', 3600);

    expect(redis.set).toHaveBeenCalledWith(
      'revoked:abc123hash',
      '1',
      'EX',
      3600,
    );
  });

  it('should return true for revoked token', async () => {
    redis.exists.mockResolvedValue(1);

    const result = await repository.isRevoked('abc123hash');

    expect(result).toBe(true);
    expect(redis.exists).toHaveBeenCalledWith('revoked:abc123hash');
  });

  it('should return false for non-revoked token', async () => {
    redis.exists.mockResolvedValue(0);

    const result = await repository.isRevoked('unknown-hash');

    expect(result).toBe(false);
  });
});
