'use client';

import type { SnapshotSummary } from '../../domain/entities/snapshot.entity';
import { formatRelativeDate } from '@/common/helpers/format-relative-date';

interface HistoryTimelineProps {
  snapshots: SnapshotSummary[];
  loading: boolean;
  hasMore: boolean;
  selectedSnapshotId: string | null;
  onSelect: (snapshotId: string) => void;
  onLoadMore: () => void;
}

function SkeletonEntry() {
  return (
    <div className="flex gap-2 animate-pulse">
      <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-3 bg-muted rounded w-24" />
        <div className="h-3 bg-muted rounded w-16" />
      </div>
    </div>
  );
}

export function HistoryTimeline({
  snapshots,
  loading,
  hasMore,
  selectedSnapshotId,
  onSelect,
  onLoadMore,
}: HistoryTimelineProps) {
  if (!loading && snapshots.length === 0) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-foreground-secondary">No hay historial disponible</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="relative">
        {/* Vertical connector line */}
        {snapshots.length > 1 && (
          <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
        )}

        <div className="space-y-3">
          {snapshots.map((snapshot) => {
            const isSelected = selectedSnapshotId === snapshot.id;
            return (
              <button
                key={snapshot.id}
                onClick={() => onSelect(snapshot.id)}
                className={`relative flex items-start gap-2 w-full text-left rounded-md px-1 py-1 transition-colors hover:bg-muted ${
                  isSelected ? 'bg-muted' : ''
                }`}
                data-testid={`snapshot-entry-${snapshot.id}`}
              >
                {/* Avatar dot on the timeline */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0 relative z-10"
                  style={{ backgroundColor: '#6b7280' }}
                >
                  {(snapshot.authorName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{snapshot.authorName || 'Usuario'}</p>
                  <p className="text-xs text-foreground-secondary">
                    {formatRelativeDate(snapshot.createdAt)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="mt-3 space-y-3">
          <SkeletonEntry />
          <SkeletonEntry />
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={onLoadMore}
          className="mt-3 w-full text-xs text-primary hover:underline py-1"
          data-testid="load-more-snapshots"
        >
          Cargar más
        </button>
      )}
    </div>
  );
}
