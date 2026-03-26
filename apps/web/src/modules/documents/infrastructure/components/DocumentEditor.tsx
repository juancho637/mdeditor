'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { EditorView } from '@codemirror/view';
import type * as Y from 'yjs';
import type { Document } from '../../domain/types/document.type';
import { MarkdownToolbar } from './toolbar/MarkdownToolbar';
import { useCollaborationViewModel } from '@/modules/collaboration/infrastructure/hooks/use-collaboration.viewmodel';

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
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const initialLoadRef = useRef(true);
  const previewScrollRef = useRef(0);

  // Collaboration state
  const {
    initCollaboration, destroyCollaboration,
    isSynced, saveStatus: collabSaveStatus,
  } = useCollaborationViewModel();
  const [collabState, setCollabState] = useState<{
    yText: Y.Text;
    undoManager: Y.UndoManager;
    awareness: any;
  } | null>(null);
  const [previewContent, setPreviewContent] = useState(document.contentMarkdown);

  const isCollaborative = !!collabState && isSynced;
  const effectiveSaveStatus = isCollaborative ? collabSaveStatus : saveStatus;

  contentRef.current = content;

  const handleEditorReady = useCallback((view: EditorView) => {
    setEditorView(view);
  }, []);

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

  // Initialize collaboration when document changes
  useEffect(() => {
    if (readOnly) return;

    const result = initCollaboration(document.id);
    if (result) {
      // Wait for sync before switching to collaborative mode
      const onSynced = (event: { synced: boolean }) => {
        if (event.synced) {
          setCollabState({
            yText: result.yText,
            undoManager: result.undoManager,
            awareness: result.provider.awareness,
          });
          setPreviewContent(result.yText.toString());
        }
      };
      result.provider.on('synced', onSynced);

      // Observe yText for preview updates (works even before sync for local edits)
      const observer = () => {
        setPreviewContent(result.yText.toString());
      };
      result.yText.observe(observer);

      return () => {
        result.provider.off('synced', onSynced);
        result.yText.unobserve(observer);
        destroyCollaboration();
        setCollabState(null);
      };
    }
  }, [document.id, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle document switching (both modes)
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      if (!initialLoadRef.current && !readOnly && !isCollaborative) {
        onSave(document.id, contentRef.current);
      }
    }
    setContent(document.contentMarkdown);
    setPreviewContent(document.contentMarkdown);
    initialLoadRef.current = true;
  }, [document.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Non-collaborative: autosave with debounce
  useEffect(() => {
    if (isCollaborative) return; // Yjs handles persistence

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
  }, [content, document.id, onSave, readOnly, isCollaborative]);

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    setPreviewContent(newContent);
  }, []);

  const modeTabClass = (tabMode: EditorMode) =>
    `px-3 py-1 text-xs rounded transition-colors ${
      mode === tabMode
        ? 'bg-background text-foreground shadow-sm'
        : 'text-foreground-secondary hover:text-foreground'
    }`;

  const showToolbar = !readOnly && mode !== EditorMode.PREVIEW;

  const saveStatusLabel = useMemo(() => {
    if (readOnly) return 'Solo lectura';
    if (effectiveSaveStatus === 'saving' || effectiveSaveStatus === 'syncing') return 'Guardando...';
    if (effectiveSaveStatus === 'saved' || effectiveSaveStatus === 'synced') return '✓ Guardado';
    return '';
  }, [readOnly, effectiveSaveStatus]);

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
          {saveStatusLabel}
        </span>
      </div>

      {showToolbar && <MarkdownToolbar editorView={editorView} />}

      <div className="flex-1 overflow-hidden transition-opacity duration-200">
        {mode === EditorMode.EDITOR && !readOnly && (
          <CodeMirrorEditor
            content={content}
            readOnly={readOnly}
            onChange={handleChange}
            onEditorReady={handleEditorReady}
            yText={collabState?.yText}
            undoManager={collabState?.undoManager}
            awareness={collabState?.awareness}
          />
        )}

        {mode === EditorMode.PREVIEW && <MarkdownPreview content={previewContent} />}

        {mode === EditorMode.HYBRID && !readOnly && (
          <SplitView
            editorContent={
              <CodeMirrorEditor
                content={content}
                readOnly={readOnly}
                onChange={handleChange}
                onEditorReady={handleEditorReady}
                yText={collabState?.yText}
                undoManager={collabState?.undoManager}
                awareness={collabState?.awareness}
              />
            }
            previewContent={<MarkdownPreview content={previewContent} />}
          />
        )}
      </div>
    </div>
  );
}
