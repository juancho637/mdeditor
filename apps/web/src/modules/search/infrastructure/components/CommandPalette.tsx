'use client';

import { useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { useSearchViewModel } from '../hooks/use-search.viewmodel';
import { useDocumentViewModel } from '@/modules/documents/infrastructure/hooks/use-document.viewmodel';
import type { SearchResult } from '../../domain/types/search-result.type';

export function CommandPalette() {
  const { isOpen, query, results, isLoading, closeSearch, search } =
    useSearchViewModel();
  const { loadDocument } = useDocumentViewModel();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeSearch();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch]);

  // Delay focus to let any Sheet close animation (300ms) finish first
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  const handleSelect = (result: SearchResult) => {
    loadDocument(result.id);
    closeSearch();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] bg-black/50"
      onClick={closeSearch}
    >
      <div
        className="w-full max-w-lg mx-4 bg-background border border-border rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3">
            <span className="text-foreground-secondary mr-2 text-sm">🔍</span>
            <Command.Input
              ref={inputRef}
              value={query}
              onValueChange={search}
              placeholder="Buscar documentos..."
              className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-foreground-secondary"
            />
            {query && (
              <button
                onClick={() => search('')}
                className="text-xs text-foreground-secondary hover:text-foreground px-1"
              >
                ✕
              </button>
            )}
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-1">
            {isLoading && (
              <Command.Empty className="py-6 text-center text-sm text-foreground-secondary">
                Buscando...
              </Command.Empty>
            )}

            {!isLoading && query.trim().length >= 2 && results.length === 0 && (
              <Command.Empty className="py-6 text-center text-sm text-foreground-secondary">
                <div>
                  No se encontraron documentos para &ldquo;{query}&rdquo;
                </div>
                <button
                  onClick={() => search('')}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Limpiar búsqueda
                </button>
              </Command.Empty>
            )}

            {!isLoading && results.length > 0 && (
              <Command.Group>
                {results.map((result) => (
                  <Command.Item
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex flex-col gap-0.5 px-3 py-2.5 rounded-md cursor-pointer aria-selected:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📄</span>
                      <span className="text-sm font-medium truncate">
                        {result.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-6">
                      <span className="text-xs text-foreground-secondary">
                        📁 {result.folderName}
                      </span>
                    </div>
                    {result.preview && (
                      <div
                        className="ml-6 text-xs text-foreground-secondary line-clamp-1 [&_b]:font-semibold [&_b]:text-foreground"
                        dangerouslySetInnerHTML={{ __html: result.preview }}
                      />
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {!query && (
            <div className="border-t border-border px-3 py-2 text-xs text-foreground-secondary">
              Escribe para buscar en tus documentos
            </div>
          )}
        </Command>
      </div>
    </div>
  );
}
