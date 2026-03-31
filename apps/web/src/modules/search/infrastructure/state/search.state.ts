import { create } from 'zustand';
import type { SearchResult } from '../../domain/types/search-result.type';

interface SearchState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  isLoading: boolean;
}

interface SearchActions {
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  isOpen: false,
  query: '',
  results: [],
  isLoading: false,

  setOpen: (isOpen) => set({ isOpen }),
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setLoading: (isLoading) => set({ isLoading }),
}));
