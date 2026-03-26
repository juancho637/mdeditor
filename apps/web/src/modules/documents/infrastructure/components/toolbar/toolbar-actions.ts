import type { EditorView } from '@codemirror/view';
import { ToolbarAction } from '../../../domain/enums/toolbar-actions.enum';

export function wrapSelection(view: EditorView, before: string, after: string): boolean {
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

const PREFIX_PATTERNS: Record<string, RegExp> = {
  heading: /^#{1,6}\s/,
  bullet: /^- /,
  numbered: /^\d+\.\s/,
  checklist: /^- \[[ x]\]\s/,
  blockquote: /^>\s/,
};

function getPrefixCategory(prefix: string): string {
  if (prefix.startsWith('#')) return 'heading';
  if (prefix === '- [ ] ') return 'checklist';
  if (prefix === '- ') return 'bullet';
  if (prefix === '1. ') return 'numbered';
  if (prefix === '> ') return 'blockquote';
  return '';
}

function insertPrefix(view: EditorView, prefix: string): void {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const category = getPrefixCategory(prefix);
  const pattern = category ? PREFIX_PATTERNS[category] : null;
  const existingMatch = pattern ? line.text.match(pattern) : null;
  const replaceTo = existingMatch ? line.from + existingMatch[0].length : line.from;

  view.dispatch({
    changes: { from: line.from, to: replaceTo, insert: prefix },
    selection: { anchor: line.from + prefix.length },
  });
}

function insertBlock(view: EditorView, block: string): void {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const needsNewlineBefore = line.from > 0 && line.text.trim() !== '';
  const insert = (needsNewlineBefore ? '\n' : '') + block + '\n';
  const insertFrom = needsNewlineBefore ? line.to : line.from;
  view.dispatch({
    changes: { from: insertFrom, insert },
    selection: { anchor: insertFrom + insert.length },
  });
}

function generateTable(rows: number, cols: number): string {
  const header = '| ' + Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(' | ') + ' |';
  const separator = '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |';
  const dataRows = Array.from(
    { length: rows },
    () => '| ' + Array.from({ length: cols }, () => 'Cell').join(' | ') + ' |',
  ).join('\n');
  return `${header}\n${separator}\n${dataRows}`;
}

export function executeToolbarAction(
  view: EditorView,
  action: ToolbarAction,
  params?: Record<string, string>,
): void {
  const headingPrefixes: Partial<Record<ToolbarAction, string>> = {
    [ToolbarAction.HEADING_1]: '# ',
    [ToolbarAction.HEADING_2]: '## ',
    [ToolbarAction.HEADING_3]: '### ',
    [ToolbarAction.HEADING_4]: '#### ',
    [ToolbarAction.HEADING_5]: '##### ',
    [ToolbarAction.HEADING_6]: '###### ',
  };

  if (headingPrefixes[action]) {
    insertPrefix(view, headingPrefixes[action]!);
    view.focus();
    return;
  }

  switch (action) {
    case ToolbarAction.BOLD:
      wrapSelection(view, '**', '**');
      break;
    case ToolbarAction.ITALIC:
      wrapSelection(view, '*', '*');
      break;
    case ToolbarAction.STRIKETHROUGH:
      wrapSelection(view, '~~', '~~');
      break;
    case ToolbarAction.CODE:
      wrapSelection(view, '`', '`');
      break;
    case ToolbarAction.BULLET_LIST:
      insertPrefix(view, '- ');
      break;
    case ToolbarAction.NUMBERED_LIST:
      insertPrefix(view, '1. ');
      break;
    case ToolbarAction.CHECKLIST:
      insertPrefix(view, '- [ ] ');
      break;
    case ToolbarAction.BLOCKQUOTE:
      insertPrefix(view, '> ');
      break;
    case ToolbarAction.HORIZONTAL_RULE:
      insertBlock(view, '---');
      break;
    case ToolbarAction.LINK: {
      const url = params?.url || 'url';
      const { from, to } = view.state.selection.main;
      const selectedText = from === to ? 'text' : view.state.sliceDoc(from, to);
      const linkText = `[${selectedText}](${url})`;
      view.dispatch({
        changes: { from, to, insert: linkText },
        selection: { anchor: from + linkText.length },
      });
      break;
    }
    case ToolbarAction.IMAGE: {
      const altText = 'alt text';
      const imgUrl = params?.url || 'url';
      const imgText = `![${altText}](${imgUrl})`;
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: imgText },
        selection: { anchor: from + imgText.length },
      });
      break;
    }
    case ToolbarAction.TABLE: {
      const rows = parseInt(params?.rows || '2', 10);
      const cols = parseInt(params?.cols || '3', 10);
      insertBlock(view, generateTable(rows, cols));
      break;
    }
  }

  view.focus();
}
