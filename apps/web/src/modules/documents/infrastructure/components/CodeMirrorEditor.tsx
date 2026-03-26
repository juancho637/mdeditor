'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from '@codemirror/language';
import { lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { wrapSelection, executeToolbarAction } from './toolbar/toolbar-actions';
import { ToolbarAction } from '../../domain/enums/toolbar-actions.enum';
import type * as Y from 'yjs';
import type { Extension } from '@codemirror/state';

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

const editorTheme = EditorView.theme({
  '&': {
    fontFamily: 'var(--font-jetbrains-mono, monospace)',
    fontSize: '14px',
    height: '100%',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '16px',
    minHeight: '100%',
  },
  '.cm-gutters': {
    border: 'none',
  },
});

interface CodeMirrorEditorProps {
  content: string;
  readOnly: boolean;
  onChange: (content: string) => void;
  onEditorReady?: (view: EditorView | null) => void;
  yText?: Y.Text;
  undoManager?: Y.UndoManager;
  awareness?: any;
}

export function CodeMirrorEditor({ content, readOnly, onChange, onEditorReady, yText, undoManager, awareness }: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onEditorReadyRef = useRef(onEditorReady);
  onChangeRef.current = onChange;
  onEditorReadyRef.current = onEditorReady;

  const isCollaborative = !!yText;

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    let view: EditorView | null = null;
    let cancelled = false;

    const initEditor = async () => {
      if (!containerRef.current || cancelled) return;

      const baseExtensions: Extension[] = [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        editorTheme,
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
    };

    void initEditor();

    return () => {
      cancelled = true;
      if (view) {
        view.destroy();
      }
      viewRef.current = null;
      onEditorReadyRef.current?.(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, isCollaborative, yText]);

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
