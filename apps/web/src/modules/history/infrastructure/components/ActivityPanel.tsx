'use client';

import { useEffect, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import type { AwarenessUser } from '@/modules/collaboration/domain/entities/awareness-user';
import { Separator } from '@/common/components/ui/separator';
import { LiveActivitySection } from './LiveActivitySection';
import { HistoryTimeline } from './HistoryTimeline';
import { DiffView } from './DiffView';
import { RestoreConfirmDialog } from './RestoreConfirmDialog';
import { useHistoryViewModel } from '../hooks/use-history.viewmodel';

interface ActivityPanelProps {
  documentId: string;
  connectedUsers: AwarenessUser[];
  isOpen: boolean;
  canEdit: boolean;
  onClose: () => void;
}

export function ActivityPanel({ documentId, connectedUsers, isOpen, canEdit, onClose }: ActivityPanelProps) {
  const {
    snapshots,
    loading,
    error,
    selectedSnapshot,
    previousSnapshot,
    loadingDetail,
    restoring,
    loadMore,
    selectSnapshot,
    clearSelection,
    restoreSnapshot,
    hasMore,
  } = useHistoryViewModel(documentId);

  const [restoreTargetSnapshotId, setRestoreTargetSnapshotId] = useState<string | null>(null);

  // Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Clear diff selection when closing
  useEffect(() => {
    if (!isOpen) clearSelection();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestoreRequest = useCallback((snapshotId: string) => {
    setRestoreTargetSnapshotId(snapshotId);
  }, []);

  const handleRestoreConfirm = useCallback(async () => {
    if (!restoreTargetSnapshotId) return;
    const success = await restoreSnapshot(restoreTargetSnapshotId);
    if (success) {
      setRestoreTargetSnapshotId(null);
    }
  }, [restoreTargetSnapshotId, restoreSnapshot]);

  const handleRestoreCancel = useCallback(() => {
    setRestoreTargetSnapshotId(null);
  }, []);

  return (
    <>
      {/* Mobile/tablet backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
          data-testid="activity-panel-backdrop"
        />
      )}

      {/* Panel — always rendered, slides in/out via CSS transition */}
      <aside
        className={`
          fixed right-0 top-0 bottom-0 z-50
          w-[280px] bg-secondary border-l border-border
          flex flex-col
          transition-transform duration-200 ease-in-out
          max-sm:w-full max-sm:top-auto max-sm:max-h-[70vh] max-sm:rounded-t-xl
          lg:relative lg:z-0
          ${isOpen ? 'translate-x-0 max-sm:translate-y-0' : 'translate-x-full max-sm:translate-x-0 max-sm:translate-y-full'}
          ${!isOpen ? 'lg:hidden' : ''}
        `}
        data-testid="activity-panel"
        role="complementary"
        aria-label="Panel de actividad"
        aria-hidden={!isOpen}
      >
        {/* Drag handle for mobile */}
        <div className="sm:hidden flex justify-center pt-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold">Actividad</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Cerrar panel de actividad"
            data-testid="close-activity-panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Live Activity Section */}
          <div>
            <h4 className="px-3 pt-3 pb-1 text-xs font-medium text-foreground-secondary uppercase tracking-wide">
              Actividad en vivo
            </h4>
            <LiveActivitySection connectedUsers={connectedUsers} />
          </div>

          <Separator />

          {/* History Section */}
          <div>
            <h4 className="px-3 pt-3 pb-1 text-xs font-medium text-foreground-secondary uppercase tracking-wide">
              Historial
            </h4>

            {error && (
              <p className="px-3 py-2 text-xs text-red-500">{error}</p>
            )}

            {selectedSnapshot ? (
              <DiffView
                selected={selectedSnapshot}
                previous={previousSnapshot}
                loading={loadingDetail}
                canEdit={canEdit}
                restoring={restoring}
                onClose={clearSelection}
                onRestore={handleRestoreRequest}
              />
            ) : (
              <HistoryTimeline
                snapshots={snapshots}
                loading={loading}
                hasMore={hasMore}
                selectedSnapshotId={null}
                onSelect={selectSnapshot}
                onLoadMore={loadMore}
              />
            )}
          </div>
        </div>
      </aside>

      {/* Restore confirmation dialog */}
      <RestoreConfirmDialog
        isOpen={restoreTargetSnapshotId !== null}
        snapshotDate={selectedSnapshot?.createdAt ?? ''}
        restoring={restoring}
        onConfirm={handleRestoreConfirm}
        onCancel={handleRestoreCancel}
      />
    </>
  );
}
