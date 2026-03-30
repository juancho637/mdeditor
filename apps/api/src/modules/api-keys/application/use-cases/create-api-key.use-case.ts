import { randomUUID, createHash } from 'crypto';

import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';

import {
  ApiKeyRepositoryInterface,
  ApiKeyType,
  apiKeyErrorsCodes,
} from '../../domain';

const MAX_ACTIVE_API_KEYS = 3;

export class CreateApiKeyUseCase {
  private readonly context = CreateApiKeyUseCase.name;

  constructor(
    private readonly apiKeyRepository: ApiKeyRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: {
    userId: string;
    name: string;
  }): Promise<{ apiKey: ApiKeyType; rawKey: string }> {
    const activeCount = await this.apiKeyRepository.countActiveByUserId(
      data.userId,
    );

    if (activeCount >= MAX_ACTIVE_API_KEYS) {
      throw this.exception.forbiddenException({
        message: apiKeyErrorsCodes.AKY005,
        context: this.context,
      });
    }

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
