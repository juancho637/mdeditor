'use client';

import { useState, useEffect, useRef } from 'react';
import type { Document } from '../../domain/types/document.type';

interface DocumentEditorProps {
  document: Document;
  saveStatus: 'idle' | 'saving' | 'saved';
  onSave: (id: string, contentMarkdown: string) => Promise<void>;
}

export function DocumentEditor({ document, saveStatus, onSave }: DocumentEditorProps) {
  const [content, setContent] = useState(document.contentMarkdown);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const initialLoadRef = useRef(true);

  contentRef.current = content;

  // Flush pending save and reset content when document changes
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      // Flush: save the pending content for the previous document
      if (!initialLoadRef.current) {
        onSave(document.id, contentRef.current);
      }
    }
    setContent(document.contentMarkdown);
    initialLoadRef.current = true;
  }, [document.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave with debounce
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      onSave(document.id, content);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, document.id, onSave]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h2 className="text-lg font-medium">{document.title}</h2>
        <span className="text-xs text-foreground-secondary">
          {saveStatus === 'saving' && 'Guardando...'}
          {saveStatus === 'saved' && '✓ Guardado'}
        </span>
      </div>
      <textarea
        className="flex-1 w-full p-4 bg-background text-foreground font-mono text-sm resize-none outline-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tu contenido markdown aquí..."
        spellCheck={false}
      />
    </div>
  );
}
