import { RevokeApiKeyUseCase } from '../revoke-api-key.use-case';
import { ApiKeyRepositoryInterface } from '../../../domain';

describe('RevokeApiKeyUseCase', () => {
  let useCase: RevokeApiKeyUseCase;
  let apiKeyRepository: jest.Mocked<ApiKeyRepositoryInterface>;

  beforeEach(() => {
    apiKeyRepository = {
      findByKeyHash: jest.fn(),
      findByUserId: jest.fn(),
      countActiveByUserId: jest.fn(),
      create: jest.fn(),
      deactivate: jest.fn().mockResolvedValue(undefined),
      updateLastUsed: jest.fn(),
    };

    useCase = new RevokeApiKeyUseCase(apiKeyRepository);
  });

  it('should revoke API key successfully', async () => {
    await useCase.run({ id: 'key-id', userId: 'user-id' });

    expect(apiKeyRepository.deactivate).toHaveBeenCalledWith(
      'key-id',
      'user-id',
    );
  });

  it('should propagate error when key not found or not owned', async () => {
    apiKeyRepository.deactivate.mockRejectedValue(new Error('Not Found'));

    await expect(
      useCase.run({ id: 'invalid-id', userId: 'user-id' }),
    ).rejects.toThrow();
  });
});
