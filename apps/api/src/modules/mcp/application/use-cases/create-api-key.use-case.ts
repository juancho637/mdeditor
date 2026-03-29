import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

import { ApiKeyRepositoryInterface, ApiKeyType } from '../../domain';

export class CreateApiKeyUseCase {
  constructor(private readonly apiKeyRepository: ApiKeyRepositoryInterface) {}

  async run(data: { userId: string; name: string }): Promise<{ apiKey: ApiKeyType; rawKey: string }> {
    const rawKey = `mk_${randomUUID()}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const prefix = rawKey.substring(0, 7);

    const apiKey = await this.apiKeyRepository.create({
      userId: data.userId,
      keyHash,
      prefix,
      name: data.name,
    });

    return { apiKey, rawKey };
  }
}
