import { Repository } from 'typeorm';

import { ExceptionServiceInterface } from '@common/exception/domain';

import {
  ApiKeyRepositoryInterface,
  ApiKeyType,
  CreateApiKeyType,
  apiKeyErrorsCodes,
} from '../../domain';
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

  async findByUserId(userId: string): Promise<ApiKeyType[]> {
    try {
      const entities = await this.repository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      return entities.map((entity) => this.toDomain(entity));
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: apiKeyErrorsCodes.AKY001,
        context: ApiKeyOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async countActiveByUserId(userId: string): Promise<number> {
    try {
      return await this.repository.count({
        where: { userId, isActive: true },
      });
    } catch (error) {
      throw this.exception.internalServerErrorException({
        message: apiKeyErrorsCodes.AKY001,
        context: ApiKeyOrmRepository.name,
        error: error as Error,
      });
    }
  }

  async deactivate(id: string, userId: string): Promise<void> {
    try {
      const result = await this.repository.update(
        { id, userId, isActive: true },
        { isActive: false },
      );
      if (result.affected === 0) {
        throw new Error('API key not found or does not belong to user');
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'API key not found or does not belong to user'
      ) {
        throw this.exception.notFoundException({
          message: apiKeyErrorsCodes.AKY006,
          context: ApiKeyOrmRepository.name,
        });
      }
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
