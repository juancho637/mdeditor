'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useApiKeyStore } from '../state/api-key.state';
import { apiKeyRepository } from '../repositories/api-key-v1.repository';

function extractError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { message?: string } } };
    if (ax.response?.data?.message) return String(ax.response.data.message);
  }
  return err instanceof Error ? err.message : fallback;
}

export function useApiKeyViewModel() {
  const {
    apiKeys,
    isLoadingList,
    isSubmitting,
    error,
    setApiKeys,
    addApiKey,
    updateApiKey,
    setLoadingList,
    setSubmitting,
    setError,
  } = useApiKeyStore();

  const loadApiKeys = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const list = await apiKeyRepository.list();
      setApiKeys(list);
    } catch (err) {
      setError(extractError(err, 'Error al cargar API keys'));
    } finally {
      setLoadingList(false);
    }
  }, [setApiKeys, setLoadingList, setError]);

  const createApiKey = useCallback(
    async (name: string) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await apiKeyRepository.create(name);
        addApiKey({
          id: response.id,
          name: response.name,
          prefix: response.prefix,
          isActive: true,
          lastUsedAt: null,
          createdAt: response.createdAt,
        });
        return response.apiKey;
      } catch (err) {
        setError(extractError(err, 'Error al crear API key'));
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [addApiKey, setSubmitting, setError],
  );

  const revokeApiKey = useCallback(
    async (id: string) => {
      setSubmitting(true);
      setError(null);
      try {
        await apiKeyRepository.revoke(id);
        updateApiKey(id, { isActive: false });
        return true;
      } catch (err) {
        setError(extractError(err, 'Error al revocar API key'));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [updateApiKey, setSubmitting, setError],
  );

  const activeCount = useMemo(
    () => apiKeys.filter((k) => k.isActive).length,
    [apiKeys],
  );

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  return {
    apiKeys,
    isLoading: isLoadingList,
    isSubmitting,
    error,
    activeCount,
    createApiKey,
    revokeApiKey,
  };
}
