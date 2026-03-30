import { apiClient } from '@/common/adapters/api-client';
import type { ApiKeyRepository } from '../../domain/repositories/api-key-repository';
import type { ApiKey } from '../../domain/types/api-key.type';
import type { CreateApiKeyResponse } from '../../domain/types/create-api-key-response.type';

interface ApiKeyWireResponse {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface CreateApiKeyWireResponse {
  id: string;
  name: string;
  prefix: string;
  api_key: string;
  created_at: string;
}

function mapApiKey(wire: ApiKeyWireResponse): ApiKey {
  return {
    id: wire.id,
    name: wire.name,
    prefix: wire.prefix,
    isActive: wire.is_active,
    lastUsedAt: wire.last_used_at,
    createdAt: wire.created_at,
  };
}

function mapCreateResponse(
  wire: CreateApiKeyWireResponse,
): CreateApiKeyResponse {
  return {
    id: wire.id,
    name: wire.name,
    prefix: wire.prefix,
    apiKey: wire.api_key,
    createdAt: wire.created_at,
  };
}

export class ApiKeyV1Repository implements ApiKeyRepository {
  async list(): Promise<ApiKey[]> {
    const response = await apiClient.get<ApiKeyWireResponse[]>('/api/mcp/keys');
    return (response.data as ApiKeyWireResponse[]).map(mapApiKey);
  }

  async create(name: string): Promise<CreateApiKeyResponse> {
    const response = await apiClient.post<CreateApiKeyWireResponse>(
      '/api/mcp/keys',
      { name },
    );
    return mapCreateResponse(response.data);
  }

  async revoke(id: string): Promise<void> {
    await apiClient.delete(`/api/mcp/keys/${id}`);
  }
}

export const apiKeyRepository = new ApiKeyV1Repository();
