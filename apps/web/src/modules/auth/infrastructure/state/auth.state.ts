import { create } from 'zustand';
import type { AuthState } from '../../domain/entities/auth';

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

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setSetupCompleted: (isSetupCompleted) => set({ isSetupCompleted }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setTokens: (accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      // Also set cookie so Next.js middleware can read it
      setCookie('access_token', accessToken, 7);
    }
    set({ isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      removeCookie('access_token');
    }
    set(initialState);
  },

  reset: () => set(initialState),
}));
