'use client';

import { useMemo } from 'react';
import { diffLines } from 'diff';
import { RotateCcw } from 'lucide-react';
import type { SnapshotDetail } from '../../domain/entities/snapshot.entity';
import { formatRelativeDate } from '@/common/helpers/format-relative-date';

interface DiffViewProps {
  selected: SnapshotDetail;
  previous: SnapshotDetail | null;
  loading: boolean;
  canEdit: boolean;
  restoring: boolean;
  onClose: () => void;
  onRestore: (snapshotId: string) => void;
}

export function DiffView({ selected, previous, loading, canEdit, restoring, onClose, onRestore }: DiffViewProps) {
  const diffResult = useMemo(() => {
    const oldText = previous?.contentMarkdown ?? '';
    const newText = selected.contentMarkdown ?? '';
    return diffLines(oldText, newText);
  }, [selected.contentMarkdown, previous?.contentMarkdown]);

  if (loading) {
    return (
      <div className="px-3 py-2 space-y-2 animate-pulse">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
      </div>
    );
  }

  return (
    <div className="px-3 py-2" data-testid="diff-view">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium">{selected.authorName}</p>
          <p className="text-xs text-foreground-secondary">
            {formatRelativeDate(selected.createdAt)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-foreground-secondary hover:text-foreground transition-colors"
          data-testid="close-diff"
        >
          Cerrar diff
        </button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <div className="max-h-64 overflow-y-auto">
          <pre className="text-xs font-mono leading-relaxed">
            {diffResult.map((part, index) => {
              const lines = part.value.replace(/\n$/, '').split('\n');
              return lines.map((line, lineIndex) => {
                let className = 'px-2 py-0.5 ';
                let prefix = ' ';

                if (part.added) {
                  className += 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
                  prefix = '+';
                } else if (part.removed) {
                  className += 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
                  prefix = '-';
                } else {
                  className += 'text-foreground-secondary opacity-70';
                }

                return (
                  <div key={`${index}-${lineIndex}`} className={className}>
                    <span className="select-none mr-2 opacity-50">{prefix}</span>
                    {line || ' '}
                  </div>
                );
              });
            })}
          </pre>
        </div>
      </div>

      {canEdit && (
        <button
          onClick={() => onRestore(selected.id)}
          disabled={restoring}
          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          data-testid="restore-version-button"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {restoring ? 'Restaurando...' : 'Restaurar esta versión'}
        </button>
      )}
    </div>
  );
}
