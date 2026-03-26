'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Document } from '../../domain/types/document.type';

const CodeMirrorEditor = dynamic(
  () => import('./CodeMirrorEditor').then((m) => ({ default: m.CodeMirrorEditor })),
  { ssr: false, loading: () => <div className="flex-1 animate-pulse bg-muted" /> },
);

interface DocumentEditorProps {
  document: Document;
  saveStatus: 'idle' | 'saving' | 'saved';
  readOnly: boolean;
  onSave: (id: string, contentMarkdown: string) => Promise<void>;
}

export function DocumentEditor({ document, saveStatus, readOnly, onSave }: DocumentEditorProps) {
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
      if (!initialLoadRef.current && !readOnly) {
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

    if (readOnly) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      onSave(document.id, content);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, document.id, onSave, readOnly]);

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h2 className="text-lg font-medium">{document.title}</h2>
        <span className="text-xs text-foreground-secondary">
          {!readOnly && saveStatus === 'saving' && 'Guardando...'}
          {!readOnly && saveStatus === 'saved' && '✓ Guardado'}
          {readOnly && 'Solo lectura'}
        </span>
      </div>
      <CodeMirrorEditor
        content={content}
        readOnly={readOnly}
        onChange={handleChange}
      />
    </div>
  );
}
