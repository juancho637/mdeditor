'use client';

import { useCallback, useRef } from 'react';
import { useSearchStore } from '../state/search.state';
import { searchRepository } from '../repositories/search-v1.repository';

export function useSearchViewModel() {
  const {
    isOpen,
    query,
    results,
    isLoading,
    setOpen,
    setQuery,
    setResults,
    setLoading,
  } = useSearchStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSearch = useCallback(() => setOpen(true), [setOpen]);
  const closeSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setOpen(false);
    setQuery('');
    setResults([]);
  }, [setOpen, setQuery, setResults]);

  const search = useCallback(
    (q: string) => {
      setQuery(q);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!q || q.trim().length < 2) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const data = await searchRepository.search(q.trim());
          setResults(data);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [setQuery, setResults, setLoading],
  );

  return { isOpen, query, results, isLoading, openSearch, closeSearch, search };
}
