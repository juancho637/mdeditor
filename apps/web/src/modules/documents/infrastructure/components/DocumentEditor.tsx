'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Document } from '../../domain/types/document.type';

const CodeMirrorEditor = dynamic(
  () => import('./CodeMirrorEditor').then((m) => ({ default: m.CodeMirrorEditor })),
  { ssr: false, loading: () => <div className="flex-1 animate-pulse bg-muted" /> },
);

const MarkdownPreview = dynamic(
  () => import('./MarkdownPreview').then((m) => ({ default: m.MarkdownPreview })),
  { ssr: false, loading: () => <div className="flex-1 animate-pulse bg-muted" /> },
);

enum EditorMode {
  EDITOR = 'editor',
  PREVIEW = 'preview',
}

interface DocumentEditorProps {
  document: Document;
  saveStatus: 'idle' | 'saving' | 'saved';
  readOnly: boolean;
  onSave: (id: string, contentMarkdown: string) => Promise<void>;
}

export function DocumentEditor({ document, saveStatus, readOnly, onSave }: DocumentEditorProps) {
  const [content, setContent] = useState(document.contentMarkdown);
  const [mode, setMode] = useState<EditorMode>(readOnly ? EditorMode.PREVIEW : EditorMode.EDITOR);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const initialLoadRef = useRef(true);

  contentRef.current = content;

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
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium">{document.title}</h2>
          <div className="flex gap-1 bg-muted rounded-md p-0.5">
            {!readOnly && (
              <button
                onClick={() => setMode(EditorMode.EDITOR)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  mode === EditorMode.EDITOR
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                Editor
              </button>
            )}
            <button
              onClick={() => setMode(EditorMode.PREVIEW)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                mode === EditorMode.PREVIEW
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
        <span className="text-xs text-foreground-secondary">
          {!readOnly && saveStatus === 'saving' && 'Guardando...'}
          {!readOnly && saveStatus === 'saved' && '✓ Guardado'}
          {readOnly && 'Solo lectura'}
        </span>
      </div>

      {mode === EditorMode.EDITOR && !readOnly ? (
        <CodeMirrorEditor
          content={content}
          readOnly={readOnly}
          onChange={handleChange}
        />
      ) : (
        <MarkdownPreview content={content} />
      )}
    </div>
  );
}
