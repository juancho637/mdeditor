'use client';

import type { ApiKey } from '../../domain/types/api-key.type';
import { formatRelativeDate } from '@/common/helpers/format-relative-date';

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  onRevoke: (apiKey: ApiKey) => void;
}

export function ApiKeyList({ apiKeys, onRevoke }: ApiKeyListProps) {
  if (apiKeys.length === 0) {
    return (
      <div
        className="text-center py-8 text-foreground-secondary text-sm"
        data-testid="api-keys-empty-state"
      >
        No tienes API keys. Genera una para conectar herramientas de IA.
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="api-keys-list">
      {apiKeys.map((apiKey) => (
        <div
          key={apiKey.id}
          className="flex items-center justify-between p-3 border border-border rounded-md"
          data-testid={`api-key-item-${apiKey.id}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {apiKey.name}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  apiKey.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
                data-testid={`api-key-status-${apiKey.id}`}
              >
                {apiKey.isActive ? 'Activa' : 'Revocada'}
              </span>
            </div>
            <div className="flex gap-4 mt-1 text-xs text-foreground-secondary">
              <span className="font-mono">{apiKey.prefix}...</span>
              <span>Creada: {formatRelativeDate(apiKey.createdAt)}</span>
              <span>
                Último uso:{' '}
                {apiKey.lastUsedAt
                  ? formatRelativeDate(apiKey.lastUsedAt)
                  : 'Nunca'}
              </span>
            </div>
          </div>
          {apiKey.isActive && (
            <button
              onClick={() => onRevoke(apiKey)}
              className="ml-4 px-3 py-1.5 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              data-testid={`api-key-revoke-${apiKey.id}`}
            >
              Revocar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
