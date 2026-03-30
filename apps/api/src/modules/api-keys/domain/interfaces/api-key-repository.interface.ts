import { ApiKeyType } from '../types/api-key.type';
import { CreateApiKeyType } from '../types/create-api-key.type';

export interface ApiKeyRepositoryInterface {
  findByKeyHash(keyHash: string): Promise<ApiKeyType | null>;
  findByUserId(userId: string): Promise<ApiKeyType[]>;
  countActiveByUserId(userId: string): Promise<number>;
  create(data: CreateApiKeyType): Promise<ApiKeyType>;
  deactivate(id: string, userId: string): Promise<void>;
  updateLastUsed(id: string): Promise<void>;
}
