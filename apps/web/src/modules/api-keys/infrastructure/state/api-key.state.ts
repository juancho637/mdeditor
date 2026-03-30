import { create } from 'zustand';
import type { ApiKey } from '../../domain/types/api-key.type';

interface ApiKeyState {
  apiKeys: ApiKey[];
  isLoadingList: boolean;
  isSubmitting: boolean;
  error: string | null;
}

interface ApiKeyActions {
  setApiKeys: (apiKeys: ApiKey[]) => void;
  addApiKey: (apiKey: ApiKey) => void;
  updateApiKey: (id: string, updates: Partial<ApiKey>) => void;
  setLoadingList: (isLoading: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
}

export const useApiKeyStore = create<ApiKeyState & ApiKeyActions>((set) => ({
  apiKeys: [],
  isLoadingList: false,
  isSubmitting: false,
  error: null,

  setApiKeys: (apiKeys) => set({ apiKeys }),
  addApiKey: (apiKey) => set((s) => ({ apiKeys: [apiKey, ...s.apiKeys] })),
  updateApiKey: (id, updates) =>
    set((s) => ({
      apiKeys: s.apiKeys.map((k) => (k.id === id ? { ...k, ...updates } : k)),
    })),
  setLoadingList: (isLoadingList) => set({ isLoadingList }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
}));
