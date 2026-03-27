import { create } from 'zustand';
import { Theme } from '../../domain';

const THEME_STORAGE_KEY = 'theme-preference';

interface ThemeState {
  theme: Theme;
  resolvedTheme: Theme.LIGHT | Theme.DARK;
}

interface ThemeActions {
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

function resolveTheme(theme: Theme): Theme.LIGHT | Theme.DARK {
  if (theme === Theme.SYSTEM) {
    if (typeof window === 'undefined') return Theme.LIGHT;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? Theme.DARK
      : Theme.LIGHT;
  }
  return theme;
}

function applyTheme(resolved: Theme.LIGHT | Theme.DARK): void {
  if (typeof document === 'undefined') return;
  if (resolved === Theme.DARK) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === Theme.LIGHT || stored === Theme.DARK || stored === Theme.SYSTEM) {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

const initialState: ThemeState = {
  theme: Theme.SYSTEM,
  resolvedTheme: Theme.LIGHT,
};

export const useThemeStore = create<ThemeState & ThemeActions>((set, get) => ({
  ...initialState,

  toggleTheme: () => {
    const { resolvedTheme } = get();
    const newTheme = resolvedTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    const newResolved = resolveTheme(newTheme);
    applyTheme(newResolved);
    storeTheme(newTheme);
    set({ theme: newTheme, resolvedTheme: newResolved });
  },

  setTheme: (theme: Theme) => {
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
    storeTheme(theme);
    set({ theme, resolvedTheme: resolved });
  },

  initTheme: () => {
    const stored = getStoredTheme();
    const theme = stored ?? Theme.SYSTEM;
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });
  },
}));
