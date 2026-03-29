import { createHash } from 'crypto';

import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';

import { ApiKeyRepositoryInterface, mcpErrorsCodes } from '../../domain';

export class ValidateApiKeyUseCase {
  private readonly context = ValidateApiKeyUseCase.name;

  constructor(
    private readonly apiKeyRepository: ApiKeyRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(rawKey: string): Promise<{ userId: string; apiKeyId: string }> {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.apiKeyRepository.findByKeyHash(keyHash);

    if (!apiKey || !apiKey.isActive) {
      throw this.exception.unauthorizedException({
        message: mcpErrorsCodes.MCP001,
        context: this.context,
      });
    }

    // Non-critical tracking — don't fail auth if this fails
    this.apiKeyRepository.updateLastUsed(apiKey.id).catch(() => {});

    return { userId: apiKey.userId, apiKeyId: apiKey.id };
  }
}
