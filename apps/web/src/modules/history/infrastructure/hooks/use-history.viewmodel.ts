import { useCallback, useEffect, useRef } from 'react';
import { useHistoryStore } from '../state/history.state';

export function useHistoryViewModel(documentId: string) {
  const {
    isPanelOpen,
    togglePanel,
    snapshots,
    total,
    page,
    loading,
    error,
    selectedSnapshot,
    previousSnapshot,
    loadingDetail,
    fetchSnapshots,
    fetchSnapshotDetail,
    clearSelection,
    reset,
  } = useHistoryStore();

  const hasFetchedRef = useRef(false);
  const prevDocumentIdRef = useRef(documentId);

  // Reset when document changes
  useEffect(() => {
    if (prevDocumentIdRef.current !== documentId) {
      reset();
      hasFetchedRef.current = false;
      prevDocumentIdRef.current = documentId;
    }
  }, [documentId, reset]);

  // Fetch snapshots when panel opens (lazy loading)
  useEffect(() => {
    if (isPanelOpen && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchSnapshots(documentId);
    }
  }, [isPanelOpen, documentId, fetchSnapshots]);

  const loadMore = useCallback(() => {
    if (!loading && snapshots.length < total) {
      fetchSnapshots(documentId, page + 1);
    }
  }, [loading, snapshots.length, total, documentId, page, fetchSnapshots]);

  const selectSnapshot = useCallback(
    (snapshotId: string) => {
      const index = snapshots.findIndex((s) => s.id === snapshotId);
      const previousSnapshotId = index < snapshots.length - 1 ? snapshots[index + 1]!.id : null;
      fetchSnapshotDetail(documentId, snapshotId, previousSnapshotId);
    },
    [documentId, snapshots, fetchSnapshotDetail],
  );

  return {
    isPanelOpen,
    togglePanel,
    snapshots,
    total,
    loading,
    error,
    selectedSnapshot,
    previousSnapshot,
    loadingDetail,
    loadMore,
    selectSnapshot,
    clearSelection,
    hasMore: snapshots.length < total,
  };
}
