import { ApiKeyType } from '../types/api-key.type';
import { CreateApiKeyType } from '../types/create-api-key.type';

export interface ApiKeyRepositoryInterface {
  findByKeyHash(keyHash: string): Promise<ApiKeyType | null>;
  create(data: CreateApiKeyType): Promise<ApiKeyType>;
  updateLastUsed(id: string): Promise<void>;
}
