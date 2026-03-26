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

const SplitView = dynamic(
  () => import('./SplitView').then((m) => ({ default: m.SplitView })),
  { ssr: false, loading: () => <div className="flex-1 animate-pulse bg-muted" /> },
);

enum EditorMode {
  EDITOR = 'editor',
  HYBRID = 'hybrid',
  PREVIEW = 'preview',
}

const EDITOR_MODE_STORAGE_KEY = 'editor-mode-preference';

function getStoredMode(): EditorMode {
  if (typeof window === 'undefined') return EditorMode.HYBRID;
  const stored = localStorage.getItem(EDITOR_MODE_STORAGE_KEY);
  if (stored === EditorMode.EDITOR || stored === EditorMode.HYBRID || stored === EditorMode.PREVIEW) {
    return stored;
  }
  return EditorMode.HYBRID;
}

function storeMode(mode: EditorMode): void {
  try {
    localStorage.setItem(EDITOR_MODE_STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable (private browsing, quota exceeded)
  }
}

interface DocumentEditorProps {
  document: Document;
  saveStatus: 'idle' | 'saving' | 'saved';
  readOnly: boolean;
  onSave: (id: string, contentMarkdown: string) => Promise<void>;
}

export function DocumentEditor({ document, saveStatus, readOnly, onSave }: DocumentEditorProps) {
  const [content, setContent] = useState(document.contentMarkdown);
  const [mode, setMode] = useState<EditorMode>(() =>
    readOnly ? EditorMode.PREVIEW : getStoredMode(),
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const initialLoadRef = useRef(true);
  const previewScrollRef = useRef(0);

  contentRef.current = content;

  const handleModeChange = useCallback(
    (newMode: EditorMode) => {
      const previewEl = globalThis.document?.querySelector('.prose-container');
      if (previewEl) {
        previewScrollRef.current = previewEl.scrollTop;
      }

      setMode(newMode);
      if (!readOnly) {
        storeMode(newMode);
      }
    },
    [readOnly],
  );

  useEffect(() => {
    if (mode === EditorMode.PREVIEW || mode === EditorMode.HYBRID) {
      const restoreScroll = () => {
        const previewEl = globalThis.document?.querySelector('.prose-container');
        if (previewEl && previewScrollRef.current > 0) {
          previewEl.scrollTop = previewScrollRef.current;
        }
      };
      const frameId = requestAnimationFrame(restoreScroll);
      return () => cancelAnimationFrame(frameId);
    }
  }, [mode]);

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

  const modeTabClass = (tabMode: EditorMode) =>
    `px-3 py-1 text-xs rounded transition-colors ${
      mode === tabMode
        ? 'bg-background text-foreground shadow-sm'
        : 'text-foreground-secondary hover:text-foreground'
    }`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium">{document.title}</h2>
          <div className="flex gap-1 bg-muted rounded-md p-0.5" data-testid="mode-tabs">
            {!readOnly && (
              <>
                <button
                  onClick={() => handleModeChange(EditorMode.EDITOR)}
                  className={modeTabClass(EditorMode.EDITOR)}
                  data-testid="mode-editor"
                >
                  Editor
                </button>
                <button
                  onClick={() => handleModeChange(EditorMode.HYBRID)}
                  className={modeTabClass(EditorMode.HYBRID)}
                  data-testid="mode-hybrid"
                >
                  Híbrido
                </button>
              </>
            )}
            <button
              onClick={() => handleModeChange(EditorMode.PREVIEW)}
              className={modeTabClass(EditorMode.PREVIEW)}
              data-testid="mode-preview"
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

      <div className="flex-1 overflow-hidden transition-opacity duration-200">
        {mode === EditorMode.EDITOR && !readOnly && (
          <CodeMirrorEditor
            content={content}
            readOnly={readOnly}
            onChange={handleChange}
          />
        )}

        {mode === EditorMode.PREVIEW && <MarkdownPreview content={content} />}

        {mode === EditorMode.HYBRID && !readOnly && (
          <SplitView
            editorContent={
              <CodeMirrorEditor
                content={content}
                readOnly={readOnly}
                onChange={handleChange}
              />
            }
            previewContent={<MarkdownPreview content={content} />}
          />
        )}
      </div>
    </div>
  );
}
