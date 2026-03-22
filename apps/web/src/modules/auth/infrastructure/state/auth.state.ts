import { create } from 'zustand';
import { AuthState } from '../../domain';
import { saveTokens, clearTokens } from '@/common/helpers/token-storage.utils';

interface AuthActions {
  setAuthenticated: (isAuthenticated: boolean) => void;
  setSetupCompleted: (isSetupCompleted: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isSetupCompleted: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setSetupCompleted: (isSetupCompleted) => set({ isSetupCompleted }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setTokens: (accessToken, refreshToken) => {
    saveTokens(accessToken, refreshToken);
    set({ isAuthenticated: true });
  },

  logout: () => {
    clearTokens();
    set(initialState);
  },

  reset: () => set(initialState),
}));
