import type { ApiKey } from '../types/api-key.type';
import type { CreateApiKeyResponse } from '../types/create-api-key-response.type';

export interface ApiKeyRepository {
  list(): Promise<ApiKey[]>;
  create(name: string): Promise<CreateApiKeyResponse>;
  revoke(id: string): Promise<void>;
}
