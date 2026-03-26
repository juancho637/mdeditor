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
}

export function CodeMirrorEditor({ content, readOnly, onChange, onEditorReady }: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onEditorReadyRef = useRef(onEditorReady);
  onChangeRef.current = onChange;
  onEditorReadyRef.current = onEditorReady;

  const createExtensions = useCallback(() => {
    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      editorTheme,
      keymap.of([...defaultKeymap, ...historyKeymap, ...markdownKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.lineWrapping,
    ];

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
      extensions.push(EditorView.editable.of(false));
    }

    return extensions;
  }, [readOnly]);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: createExtensions(),
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    onEditorReadyRef.current?.(view);

    return () => {
      view.destroy();
      viewRef.current = null;
      onEditorReadyRef.current?.(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Update content when document changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== content) {
      view.dispatch({
        changes: { from: 0, to: currentContent.length, insert: content },
      });
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden"
      style={{ height: '100%' }}
    />
  );
}
