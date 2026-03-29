import { createHash } from 'crypto';

import { ValidateApiKeyUseCase } from '../validate-api-key.use-case';
import { ApiKeyRepositoryInterface, mcpErrorsCodes } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';

describe('ValidateApiKeyUseCase', () => {
  let useCase: ValidateApiKeyUseCase;
  let apiKeyRepository: jest.Mocked<ApiKeyRepositoryInterface>;
  let exceptionService: jest.Mocked<ExceptionServiceInterface>;

  const rawKey = 'mk_test-key-uuid-value';
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const mockApiKey = {
    id: 'key-id',
    userId: 'user-id',
    keyHash,
    prefix: 'mk_test',
    name: 'Test Key',
    isActive: true,
    lastUsedAt: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    apiKeyRepository = {
      findByKeyHash: jest.fn(),
      create: jest.fn(),
      updateLastUsed: jest.fn().mockResolvedValue(undefined),
    };

    exceptionService = {
      unauthorizedException: jest.fn().mockReturnValue(new Error('Unauthorized')),
      badRequestException: jest.fn().mockReturnValue(new Error('Bad Request')),
      forbiddenException: jest.fn().mockReturnValue(new Error('Forbidden')),
      notFoundException: jest.fn().mockReturnValue(new Error('Not Found')),
      conflictException: jest.fn().mockReturnValue(new Error('Conflict')),
      internalServerErrorException: jest.fn().mockReturnValue(new Error('Internal')),
    };

    useCase = new ValidateApiKeyUseCase(apiKeyRepository, exceptionService);
  });

  it('should return userId when key is valid', async () => {
    apiKeyRepository.findByKeyHash.mockResolvedValue(mockApiKey);

    const result = await useCase.run(rawKey);

    expect(result).toEqual({ userId: 'user-id', apiKeyId: 'key-id' });
    expect(apiKeyRepository.findByKeyHash).toHaveBeenCalledWith(keyHash);
    expect(apiKeyRepository.updateLastUsed).toHaveBeenCalledWith('key-id');
  });

  it('should throw MCP001 when key is not found', async () => {
    apiKeyRepository.findByKeyHash.mockResolvedValue(null);

    await expect(useCase.run(rawKey)).rejects.toThrow();
    expect(exceptionService.unauthorizedException).toHaveBeenCalledWith({
      message: mcpErrorsCodes.MCP001,
      context: 'ValidateApiKeyUseCase',
    });
  });

  it('should throw MCP001 when key is inactive', async () => {
    apiKeyRepository.findByKeyHash.mockResolvedValue({ ...mockApiKey, isActive: false });

    await expect(useCase.run(rawKey)).rejects.toThrow();
    expect(exceptionService.unauthorizedException).toHaveBeenCalledWith({
      message: mcpErrorsCodes.MCP001,
      context: 'ValidateApiKeyUseCase',
    });
  });

  it('should call updateLastUsed on success (fire-and-forget)', async () => {
    apiKeyRepository.findByKeyHash.mockResolvedValue(mockApiKey);
    apiKeyRepository.updateLastUsed.mockResolvedValue(undefined);

    await useCase.run(rawKey);

    expect(apiKeyRepository.updateLastUsed).toHaveBeenCalledWith('key-id');
  });

  it('should not fail auth if updateLastUsed throws', async () => {
    apiKeyRepository.findByKeyHash.mockResolvedValue(mockApiKey);
    apiKeyRepository.updateLastUsed.mockRejectedValue(new Error('DB error'));

    const result = await useCase.run(rawKey);

    expect(result).toEqual({ userId: 'user-id', apiKeyId: 'key-id' });
  });
});
