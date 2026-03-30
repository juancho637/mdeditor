'use client';

import { useState } from 'react';
import { useApiKeyViewModel } from '@/modules/api-keys/infrastructure/hooks/use-api-key.viewmodel';
import { ApiKeyList } from '@/modules/api-keys/infrastructure/components/ApiKeyList';
import { CreateApiKeyDialog } from '@/modules/api-keys/infrastructure/components/CreateApiKeyDialog';
import { RevokeApiKeyDialog } from '@/modules/api-keys/infrastructure/components/RevokeApiKeyDialog';
import type { ApiKey } from '@/modules/api-keys/domain/types/api-key.type';

const MAX_ACTIVE_API_KEYS = 3;

export default function SettingsApiKeysPage() {
  const {
    apiKeys,
    isLoading,
    isSubmitting,
    error,
    activeCount,
    createApiKey,
    revokeApiKey,
  } = useApiKeyViewModel();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  const handleCreate = async (name: string) => {
    const rawKey = await createApiKey(name);
    return rawKey;
  };

  const handleRevoke = async () => {
    if (!keyToRevoke) return;
    const success = await revokeApiKey(keyToRevoke.id);
    setKeyToRevoke(null);
    if (!success) return;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-1">API Keys</h2>
        <p className="text-sm text-foreground-secondary mb-4">
          Genera API keys para conectar herramientas de IA como Claude Code vía
          MCP.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-foreground-secondary">
            {activeCount} de {MAX_ACTIVE_API_KEYS} keys activas
          </span>
          <button
            onClick={() => setShowCreateDialog(true)}
            disabled={isSubmitting || activeCount >= MAX_ACTIVE_API_KEYS}
            className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="generate-api-key-button"
            title={
              activeCount >= MAX_ACTIVE_API_KEYS
                ? 'Máximo 3 API keys activas'
                : undefined
            }
          >
            Generar API Key
          </button>
        </div>

        {isLoading && apiKeys.length === 0 ? (
          <p className="text-sm text-foreground-secondary">Cargando...</p>
        ) : (
          <ApiKeyList apiKeys={apiKeys} onRevoke={setKeyToRevoke} />
        )}
      </div>

      <CreateApiKeyDialog
        isOpen={showCreateDialog}
        isLoading={isSubmitting}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreate}
      />

      <RevokeApiKeyDialog
        isOpen={keyToRevoke !== null}
        keyName={keyToRevoke?.name ?? ''}
        isLoading={isSubmitting}
        onConfirm={handleRevoke}
        onCancel={() => setKeyToRevoke(null)}
      />
    </div>
  );
}
