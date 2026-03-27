'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from '@codemirror/language';
import { useThemeStore } from '@/modules/theme/infrastructure/state/theme.state';
import { Theme } from '@/modules/theme/domain';
import { lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { wrapSelection, executeToolbarAction } from './toolbar/toolbar-actions';
import { ToolbarAction } from '../../domain/enums/toolbar-actions.enum';
import type * as Y from 'yjs';
import type { Extension } from '@codemirror/state';
import '@/modules/collaboration/infrastructure/components/collaboration-cursors.css';

const markdownKeymap = [
  { key: 'Mod-b', run: (view: EditorView) => wrapSelection(view, '**', '**') },
  { key: 'Mod-i', run: (view: EditorView) => wrapSelection(view, '*', '*') },
  { key: 'Mod-e', run: (view: EditorView) => wrapSelection(view, '`', '`') },
  { key: 'Mod-Shift-s', run: (view: EditorView) => wrapSelection(view, '~~', '~~') },
  {
    key: 'Mod-k',
    run: (view: EditorView) => {
      executeToolbarAction(view, ToolbarAction.LINK);
      return true;
    },
  },
];

const baseEditorTheme = EditorView.theme({
  '&': {
    fontFamily: 'var(--font-jetbrains-mono, monospace)',
    fontSize: '14px',
    height: '100%',
    backgroundColor: 'var(--background-secondary)',
    color: 'var(--foreground)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '16px',
    minHeight: '100%',
    caretColor: 'var(--primary)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--primary)',
  },
  '.cm-gutters': {
    border: 'none',
    backgroundColor: 'var(--background-secondary)',
    color: 'var(--foreground-secondary)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--muted)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--muted)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 25%, transparent)',
  },
});

function getHighlightExtension(isDark: boolean) {
  return isDark
    ? syntaxHighlighting(oneDarkHighlightStyle)
    : syntaxHighlighting(defaultHighlightStyle);
}

interface CodeMirrorEditorProps {
  content: string;
  readOnly: boolean;
  onChange: (content: string) => void;
  onEditorReady?: (view: EditorView | null) => void;
  onScrollerReady?: (el: HTMLElement | null) => void;
  yText?: Y.Text;
  undoManager?: Y.UndoManager;
  awareness?: any;
}

export function CodeMirrorEditor({ content, readOnly, onChange, onEditorReady, onScrollerReady, yText, undoManager, awareness }: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onEditorReadyRef = useRef(onEditorReady);
  const onScrollerReadyRef = useRef(onScrollerReady);
  const highlightCompartmentRef = useRef(new Compartment());
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  onChangeRef.current = onChange;
  onEditorReadyRef.current = onEditorReady;
  onScrollerReadyRef.current = onScrollerReady;

  const isCollaborative = !!yText;

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    let view: EditorView | null = null;
    let cancelled = false;

    const initEditor = async () => {
      if (!containerRef.current || cancelled) return;

      const isDark = useThemeStore.getState().resolvedTheme === Theme.DARK;
      const baseExtensions: Extension[] = [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        bracketMatching(),
        highlightCompartmentRef.current.of(getHighlightExtension(isDark)),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        baseEditorTheme,
        EditorView.lineWrapping,
      ];

      if (isCollaborative && yText) {
        const { yCollab } = await import('y-codemirror.next');
        if (cancelled) return;
        baseExtensions.push(
          yCollab(yText, awareness ?? null, { undoManager: undoManager ?? undefined }),
        );
        baseExtensions.push(keymap.of([...defaultKeymap, ...markdownKeymap]));
      } else {
        baseExtensions.push(history());
        baseExtensions.push(keymap.of([...defaultKeymap, ...historyKeymap, ...markdownKeymap]));
        baseExtensions.push(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        );
      }

      if (readOnly) {
        baseExtensions.push(EditorState.readOnly.of(true));
        baseExtensions.push(EditorView.editable.of(false));
      }

      if (cancelled || !containerRef.current) return;

      const state = EditorState.create({
        doc: isCollaborative && yText ? yText.toString() : content,
        extensions: baseExtensions,
      });

      view = new EditorView({
        state,
        parent: containerRef.current,
      });

      viewRef.current = view;
      onEditorReadyRef.current?.(view);
      onScrollerReadyRef.current?.(view.scrollDOM);
    };

    void initEditor();

    return () => {
      cancelled = true;
      if (view) {
        view.destroy();
      }
      viewRef.current = null;
      onEditorReadyRef.current?.(null);
      onScrollerReadyRef.current?.(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, isCollaborative, yText]);

  // Reconfigure syntax highlighting when theme changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.destroyed) return;
    const isDark = resolvedTheme === Theme.DARK;
    view.dispatch({
      effects: highlightCompartmentRef.current.reconfigure(getHighlightExtension(isDark)),
    });
  }, [resolvedTheme]);

  // Update content when document changes externally (non-collaborative only)
  useEffect(() => {
    if (isCollaborative) return;

    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== content) {
      view.dispatch({
        changes: { from: 0, to: currentContent.length, insert: content },
      });
    }
  }, [content, isCollaborative]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden"
      style={{ height: '100%' }}
    />
  );
}
