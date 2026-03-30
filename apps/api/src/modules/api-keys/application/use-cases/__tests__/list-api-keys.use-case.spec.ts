import { ListApiKeysUseCase } from '../list-api-keys.use-case';
import { ApiKeyRepositoryInterface } from '../../../domain';

describe('ListApiKeysUseCase', () => {
  let useCase: ListApiKeysUseCase;
  let apiKeyRepository: jest.Mocked<ApiKeyRepositoryInterface>;

  const mockApiKeys = [
    {
      id: 'key-1',
      userId: 'user-id',
      keyHash: 'hash1',
      prefix: 'mk_1234',
      name: 'Key 1',
      isActive: true,
      lastUsedAt: new Date(),
      createdAt: new Date(),
    },
    {
      id: 'key-2',
      userId: 'user-id',
      keyHash: 'hash2',
      prefix: 'mk_5678',
      name: 'Key 2',
      isActive: false,
      lastUsedAt: null,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    apiKeyRepository = {
      findByKeyHash: jest.fn(),
      findByUserId: jest.fn(),
      countActiveByUserId: jest.fn(),
      create: jest.fn(),
      deactivate: jest.fn(),
      updateLastUsed: jest.fn(),
    };

    useCase = new ListApiKeysUseCase(apiKeyRepository);
  });

  it('should return list of API keys for user', async () => {
    apiKeyRepository.findByUserId.mockResolvedValue(mockApiKeys);

    const result = await useCase.run({ userId: 'user-id' });

    expect(result).toEqual(mockApiKeys);
    expect(apiKeyRepository.findByUserId).toHaveBeenCalledWith('user-id');
  });

  it('should return empty array when user has no keys', async () => {
    apiKeyRepository.findByUserId.mockResolvedValue([]);

    const result = await useCase.run({ userId: 'user-id' });

    expect(result).toEqual([]);
  });
});
