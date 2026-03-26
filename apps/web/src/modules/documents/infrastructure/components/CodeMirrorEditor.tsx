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

function wrapSelection(view: EditorView, before: string, after: string): boolean {
  const { from, to } = view.state.selection.main;
  if (from === to) {
    const placeholder = `${before}text${after}`;
    view.dispatch({
      changes: { from, insert: placeholder },
      selection: { anchor: from + before.length, head: from + before.length + 4 },
    });
  } else {
    view.dispatch({
      changes: [
        { from, insert: before },
        { from: to, insert: after },
      ],
      selection: { anchor: from + before.length, head: to + before.length },
    });
  }
  return true;
}

const markdownKeymap = [
  { key: 'Mod-b', run: (view: EditorView) => wrapSelection(view, '**', '**') },
  { key: 'Mod-i', run: (view: EditorView) => wrapSelection(view, '*', '*') },
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
}

export function CodeMirrorEditor({ content, readOnly, onChange }: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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

    return () => {
      view.destroy();
      viewRef.current = null;
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
