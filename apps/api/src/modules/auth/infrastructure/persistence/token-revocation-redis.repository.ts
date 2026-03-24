import Redis from 'ioredis';
import { TokenRevocationRepositoryInterface } from '../../domain';

const KEY_PREFIX = 'revoked:';

export class TokenRevocationRedisRepository implements TokenRevocationRepositoryInterface {
  constructor(private readonly redis: Redis) {}

  async revoke(tokenHash: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(`${KEY_PREFIX}${tokenHash}`, '1', 'EX', ttlSeconds);
  }

  async isRevoked(tokenHash: string): Promise<boolean> {
    const result = await this.redis.exists(`${KEY_PREFIX}${tokenHash}`);
    return result === 1;
  }
}
