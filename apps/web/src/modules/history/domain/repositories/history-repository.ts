import type { SnapshotDetail, SnapshotListResponse, RestoreResult } from '../entities/snapshot.entity';

export interface HistoryRepository {
  listSnapshots(documentId: string, page: number, limit: number): Promise<SnapshotListResponse>;
  getSnapshotDetail(documentId: string, snapshotId: string): Promise<SnapshotDetail>;
  restoreSnapshot(documentId: string, snapshotId: string): Promise<RestoreResult>;
}
