'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { EditorView } from '@codemirror/view';
import type * as Y from 'yjs';
import type { Document } from '../../domain/types/document.type';
import { MarkdownToolbar } from './toolbar/MarkdownToolbar';
import { useCollaborationViewModel } from '@/modules/collaboration/infrastructure/hooks/use-collaboration.viewmodel';
import { usePresence } from '@/modules/collaboration/infrastructure/hooks/use-presence.viewmodel';
import { PresenceIndicator } from '@/modules/collaboration/infrastructure/components/PresenceIndicator';
import { ConnectionStatusBanner } from '@/modules/collaboration/infrastructure/components/ConnectionStatusBanner';
import { ConnectionIndicator } from '@/modules/collaboration/infrastructure/components/ConnectionIndicator';
import { useSyncScroll } from '../hooks/use-sync-scroll';
import { useIsMobile } from '@/common/hooks/use-is-mobile';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/common/components/ui/tabs';
import { ClipboardList, MoreVertical, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/common/components/ui/dropdown-menu';
import { ActivityPanel } from '@/modules/history/infrastructure/components/ActivityPanel';
import { useHistoryStore } from '@/modules/history/infrastructure/state/history.state';
import { SharePanel } from './SharePanel';
import { useDocumentViewModel } from '../hooks/use-document.viewmodel';

const CodeMirrorEditor = dynamic(
  () =>
    import('./CodeMirrorEditor').then((m) => ({ default: m.CodeMirrorEditor })),
  {
    ssr: false,
    loading: () => <div className="flex-1 animate-pulse bg-muted" />,
  },
);

const MarkdownPreview = dynamic(
  () =>
    import('./MarkdownPreview').then((m) => ({ default: m.MarkdownPreview })),
  {
    ssr: false,
    loading: () => <div className="flex-1 animate-pulse bg-muted" />,
  },
);

const SplitView = dynamic(
  () => import('./SplitView').then((m) => ({ default: m.SplitView })),
  {
    ssr: false,
    loading: () => <div className="flex-1 animate-pulse bg-muted" />,
  },
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
  if (
    stored === EditorMode.EDITOR ||
    stored === EditorMode.HYBRID ||
    stored === EditorMode.PREVIEW
  ) {
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

export function DocumentEditor({
  document,
  saveStatus,
  readOnly,
  onSave,
}: DocumentEditorProps) {
  const [content, setContent] = useState(document.contentMarkdown);
  const isMobileInit =
    typeof window !== 'undefined' && window.innerWidth < 1024;
  const [mode, setMode] = useState<EditorMode>(() => {
    if (readOnly) return EditorMode.PREVIEW;
    const stored = getStoredMode();
    return isMobileInit && stored === EditorMode.HYBRID
      ? EditorMode.EDITOR
      : stored;
  });
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  const initialLoadRef = useRef(true);
  const previewScrollRef = useRef(0);

  // Collaboration state
  const {
    initCollaboration,
    destroyCollaboration,
    isSynced,
    saveStatus: collabSaveStatus,
    connectionStatus,
  } = useCollaborationViewModel();
  const [collabState, setCollabState] = useState<{
    yText: Y.Text;
    undoManager: Y.UndoManager;
    awareness: any;
  } | null>(null);
  const [previewContent, setPreviewContent] = useState(
    document.contentMarkdown,
  );

  const { connectedUsers } = usePresence(collabState?.awareness ?? null);
  const { isPanelOpen, togglePanel } = useHistoryStore();
  const { createShare, getShare, revokeShare } = useDocumentViewModel();
  const [shareOpen, setShareOpen] = useState(false);
  const isCollaborationActive = !!collabState;
  const isCollaborative = isCollaborationActive && isSynced;
  const effectiveSaveStatus = isCollaborative ? collabSaveStatus : saveStatus;

  contentRef.current = content;

  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile && mode === EditorMode.HYBRID) {
      setMode(EditorMode.EDITOR);
      storeMode(EditorMode.EDITOR);
    }
  }, [isMobile, mode]);

  const { setEditorScroller, setPreviewScroller } = useSyncScroll({
    enabled: mode === EditorMode.HYBRID && !readOnly,
    editorView,
  });

  const previewRef = useCallback(
    (el: HTMLDivElement | null) => {
      setPreviewScroller(el);
    },
    [setPreviewScroller],
  );

  const handleScrollerReady = useCallback(
    (el: HTMLElement | null) => {
      setEditorScroller(el);
    },
    [setEditorScroller],
  );

  const handleEditorReady = useCallback((view: EditorView | null) => {
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
        const previewEl =
          globalThis.document?.querySelector('.prose-container');
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
    if (readOnly) return () => {};

    const result = initCollaboration(document.id);
    if (!result) {
      return () => {
        destroyCollaboration();
      };
    }

    // Switch to collaborative mode once synced
    const activateCollab = () => {
      setCollabState({
        yText: result.yText,
        undoManager: result.undoManager,
        awareness: result.provider.awareness,
      });
      setPreviewContent(result.yText.toString());
    };

    const onSynced = (synced: boolean) => {
      if (synced) activateCollab();
    };
    // @ts-expect-error y-websocket 'synced' event not in type definitions
    result.provider.on('synced', onSynced);

    // If already synced (e.g. fast connection), activate immediately
    if (result.provider.synced) {
      activateCollab();
    }

    // Observe yText for preview updates
    const observer = () => {
      setPreviewContent(result.yText.toString());
    };
    result.yText.observe(observer);

    return () => {
      // @ts-expect-error y-websocket 'synced' event not in type definitions
      result.provider.off('synced', onSynced);
      result.yText.unobserve(observer);
      destroyCollaboration();
      setCollabState(null);
    };
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
    if (effectiveSaveStatus === 'saving' || effectiveSaveStatus === 'syncing')
      return 'Guardando...';
    if (effectiveSaveStatus === 'saved' || effectiveSaveStatus === 'synced')
      return '✓ Guardado';
    return '';
  }, [readOnly, effectiveSaveStatus]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className="text-lg font-medium truncate min-w-0">
            {document.title}
          </h2>
          <div
            className="flex gap-1 bg-muted rounded-md p-0.5 shrink-0"
            data-testid="mode-tabs"
          >
            {!readOnly && (
              <>
                <button
                  onClick={() => handleModeChange(EditorMode.EDITOR)}
                  className={modeTabClass(EditorMode.EDITOR)}
                  data-testid="mode-editor"
                >
                  Editor
                </button>
                {!isMobile && (
                  <button
                    onClick={() => handleModeChange(EditorMode.HYBRID)}
                    className={modeTabClass(EditorMode.HYBRID)}
                    data-testid="mode-hybrid"
                  >
                    Híbrido
                  </button>
                )}
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
        <div className="relative flex items-center gap-2 shrink-0">
          {isCollaborative && connectedUsers.length > 0 && (
            <PresenceIndicator users={connectedUsers} />
          )}
          {isCollaborationActive && (
            <ConnectionIndicator connectionStatus={connectionStatus} />
          )}
          <span className="text-xs text-foreground-secondary hidden sm:inline">
            {saveStatusLabel}
          </span>
          {!readOnly && (
            <>
              <button
                onClick={() => setShareOpen((v) => !v)}
                className="text-xs text-foreground-secondary hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors hidden sm:inline"
                title="Compartir documento"
                data-testid="share-document-btn"
              >
                Compartir
              </button>
              {shareOpen && (
                <SharePanel
                  documentId={document.id}
                  onClose={() => setShareOpen(false)}
                  onCreateShare={createShare}
                  onGetShare={getShare}
                  onRevokeShare={revokeShare}
                />
              )}
            </>
          )}
          {/* Desktop: botones individuales */}
          <button
            onClick={() => {
              const exportContent = isCollaborationActive
                ? previewContent
                : content;
              const blob = new Blob([exportContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = globalThis.document.createElement('a');
              a.href = url;
              a.download = `${document.title}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-xs text-foreground-secondary hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors hidden sm:inline"
            title="Exportar como .md"
            data-testid="export-document"
          >
            ↓ .md
          </button>
          <button
            onClick={togglePanel}
            className={`p-1.5 rounded-md transition-colors hidden sm:flex ${
              isPanelOpen
                ? 'bg-muted text-foreground'
                : 'text-foreground-secondary hover:text-foreground hover:bg-muted'
            }`}
            aria-label="Panel de actividad"
            data-testid="activity-panel-toggle"
          >
            <ClipboardList className="w-4 h-4" />
          </button>
          {/* Mobile: menú overflow con compartir + export + historial */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1.5 rounded-md text-foreground-secondary hover:text-foreground hover:bg-muted transition-colors sm:hidden"
              aria-label="Más opciones"
              data-testid="mobile-more-menu"
            >
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!readOnly && (
                <DropdownMenuItem
                  onClick={() => setShareOpen((v) => !v)}
                  data-testid="mobile-share-document-btn"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  const exportContent = isCollaborationActive
                    ? previewContent
                    : content;
                  const blob = new Blob([exportContent], {
                    type: 'text/plain',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = globalThis.document.createElement('a');
                  a.href = url;
                  a.download = `${document.title}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                data-testid="mobile-export-document"
              >
                ↓ Exportar .md
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={togglePanel}
                data-testid="mobile-activity-panel-toggle"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Historial
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showToolbar && <MarkdownToolbar editorView={editorView} />}

      {isCollaborationActive && (
        <ConnectionStatusBanner connectionStatus={connectionStatus} />
      )}

      <div
        className={`flex flex-1 overflow-hidden${showToolbar ? ' pb-11 md:pb-0' : ''}`}
      >
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

          {mode === EditorMode.PREVIEW && (
            <div className="h-full overflow-y-auto">
              <MarkdownPreview content={previewContent} />
            </div>
          )}

          {mode === EditorMode.HYBRID && !readOnly && isMobile && (
            <Tabs defaultValue="editor" className="flex flex-col h-full">
              <TabsList
                className="mx-2 mt-2 shrink-0"
                data-testid="hybrid-tabs-mobile"
              >
                <TabsTrigger value="editor" data-testid="hybrid-tab-editor">
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" data-testid="hybrid-tab-preview">
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="editor"
                className="flex-1 overflow-hidden mt-0 pb-11"
              >
                <CodeMirrorEditor
                  content={content}
                  readOnly={readOnly}
                  onChange={handleChange}
                  onEditorReady={handleEditorReady}
                  yText={collabState?.yText}
                  undoManager={collabState?.undoManager}
                  awareness={collabState?.awareness}
                />
              </TabsContent>
              <TabsContent
                value="preview"
                className="flex-1 overflow-y-auto mt-0"
              >
                <MarkdownPreview content={previewContent} />
              </TabsContent>
            </Tabs>
          )}

          {mode === EditorMode.HYBRID && !readOnly && !isMobile && (
            <SplitView
              editorContent={
                <CodeMirrorEditor
                  content={content}
                  readOnly={readOnly}
                  onChange={handleChange}
                  onEditorReady={handleEditorReady}
                  onScrollerReady={handleScrollerReady}
                  yText={collabState?.yText}
                  undoManager={collabState?.undoManager}
                  awareness={collabState?.awareness}
                />
              }
              previewContent={<MarkdownPreview content={previewContent} />}
              previewRef={previewRef}
            />
          )}
        </div>

        <ActivityPanel
          documentId={document.id}
          connectedUsers={connectedUsers}
          isOpen={isPanelOpen}
          canEdit={!readOnly}
          onClose={togglePanel}
        />
      </div>
    </div>
  );
}
