import { ApiKeyRepositoryInterface } from '../../domain';

export class RevokeApiKeyUseCase {
  constructor(private readonly apiKeyRepository: ApiKeyRepositoryInterface) {}

  async run(data: { id: string; userId: string }): Promise<void> {
    await this.apiKeyRepository.deactivate(data.id, data.userId);
  }
}
