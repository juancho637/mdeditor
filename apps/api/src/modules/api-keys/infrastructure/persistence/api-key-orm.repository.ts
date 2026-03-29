import { Repository } from 'typeorm';

import { ExceptionServiceInterface } from '@common/exception/domain';

import { ApiKeyRepositoryInterface, ApiKeyType, CreateApiKeyType, apiKeyErrorsCodes } from '../../domain';
import { ApiKeyEntity } from './api-key.entity';

export class ApiKeyOrmRepository implements ApiKeyRepositoryInterface {
  constructor(
    private readonly repository: Repository<ApiKeyEntity>,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async findByKeyHash(keyHash: string): Promise<ApiKeyType | null> {
    try {
      const entity = await this.repository.findOne({
        where: { keyHash, isActive: true },
      });
      return entity ? this.toDomain(entity) : null;
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: apiKeyErrorsCodes.AKY001,
        context: ApiKeyOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async create(data: CreateApiKeyType): Promise<ApiKeyType> {
    try {
      const entity = this.repository.create({
        userId: data.userId,
        keyHash: data.keyHash,
        prefix: data.prefix,
        name: data.name,
      });
      const saved = await this.repository.save(entity);
      return this.toDomain(saved);
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: apiKeyErrorsCodes.AKY001,
        context: ApiKeyOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async updateLastUsed(id: string): Promise<void> {
    try {
      await this.repository.update(id, { lastUsedAt: new Date() });
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: apiKeyErrorsCodes.AKY001,
        context: ApiKeyOrmRepository.name,
        error: error as Error,
      });
    }
  }

  private toDomain(entity: ApiKeyEntity): ApiKeyType {
    return {
      id: entity.id,
      userId: entity.userId,
      keyHash: entity.keyHash,
      prefix: entity.prefix,
      name: entity.name,
      isActive: entity.isActive,
      lastUsedAt: entity.lastUsedAt,
      createdAt: entity.createdAt,
    };
  }
}
