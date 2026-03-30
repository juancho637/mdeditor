import { ApiKeyType } from '../../domain';

export class ApiKeyPresenter {
  static toResponse(apiKey: ApiKeyType) {
    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      is_active: apiKey.isActive,
      last_used_at: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : null,
      created_at: apiKey.createdAt.toISOString(),
    };
  }

  static toCreateResponse(apiKey: ApiKeyType, rawKey: string) {
    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      api_key: rawKey,
      created_at: apiKey.createdAt.toISOString(),
    };
  }
}
