import { ApiKeyRepositoryInterface, ApiKeyType } from '../../domain';

export class ListApiKeysUseCase {
  constructor(private readonly apiKeyRepository: ApiKeyRepositoryInterface) {}

  async run(data: { userId: string }): Promise<ApiKeyType[]> {
    return this.apiKeyRepository.findByUserId(data.userId);
  }
}
