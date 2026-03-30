import { CreateApiKeyUseCase } from '../create-api-key.use-case';
import { ApiKeyRepositoryInterface, apiKeyErrorsCodes } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';

describe('CreateApiKeyUseCase', () => {
  let useCase: CreateApiKeyUseCase;
  let apiKeyRepository: jest.Mocked<ApiKeyRepositoryInterface>;
  let exceptionService: jest.Mocked<ExceptionServiceInterface>;

  const mockApiKey = {
    id: 'key-id',
    userId: 'user-id',
    keyHash: 'hash',
    prefix: 'mk_1234',
    name: 'Test Key',
    isActive: true,
    lastUsedAt: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    apiKeyRepository = {
      findByKeyHash: jest.fn(),
      findByUserId: jest.fn(),
      countActiveByUserId: jest.fn(),
      create: jest.fn().mockResolvedValue(mockApiKey),
      deactivate: jest.fn(),
      updateLastUsed: jest.fn(),
    };

    exceptionService = {
      unauthorizedException: jest
        .fn()
        .mockReturnValue(new Error('Unauthorized')),
      badRequestException: jest.fn().mockReturnValue(new Error('Bad Request')),
      forbiddenException: jest.fn().mockReturnValue(new Error('Forbidden')),
      notFoundException: jest.fn().mockReturnValue(new Error('Not Found')),
      conflictException: jest.fn().mockReturnValue(new Error('Conflict')),
      internalServerErrorException: jest
        .fn()
        .mockReturnValue(new Error('Internal')),
    };

    useCase = new CreateApiKeyUseCase(apiKeyRepository, exceptionService);
  });

  it('should create API key when under limit', async () => {
    apiKeyRepository.countActiveByUserId.mockResolvedValue(0);

    const result = await useCase.run({ userId: 'user-id', name: 'Test Key' });

    expect(result.apiKey).toEqual(mockApiKey);
    expect(result.rawKey).toMatch(/^mk_/);
    expect(apiKeyRepository.countActiveByUserId).toHaveBeenCalledWith(
      'user-id',
    );
    expect(apiKeyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        name: 'Test Key',
      }),
    );
  });

  it('should create API key when at 2 active keys', async () => {
    apiKeyRepository.countActiveByUserId.mockResolvedValue(2);

    const result = await useCase.run({ userId: 'user-id', name: 'Key 3' });

    expect(result.apiKey).toEqual(mockApiKey);
    expect(apiKeyRepository.create).toHaveBeenCalled();
  });

  it('should throw AKY005 when user has 3 active keys', async () => {
    apiKeyRepository.countActiveByUserId.mockResolvedValue(3);

    await expect(
      useCase.run({ userId: 'user-id', name: 'Key 4' }),
    ).rejects.toThrow();

    expect(exceptionService.forbiddenException).toHaveBeenCalledWith({
      message: apiKeyErrorsCodes.AKY005,
      context: 'CreateApiKeyUseCase',
    });
    expect(apiKeyRepository.create).not.toHaveBeenCalled();
  });

  it('should generate key with mk_ prefix and SHA-256 hash', async () => {
    apiKeyRepository.countActiveByUserId.mockResolvedValue(0);

    const result = await useCase.run({ userId: 'user-id', name: 'Test' });

    expect(result.rawKey).toMatch(/^mk_[0-9a-f-]+$/);
    expect(apiKeyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        keyHash: expect.any(String),
        prefix: expect.stringMatching(/^mk_/),
      }),
    );
  });
});
