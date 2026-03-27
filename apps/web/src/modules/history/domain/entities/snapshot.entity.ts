export interface SnapshotSummary {
  id: string;
  documentId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface SnapshotDetail extends SnapshotSummary {
  contentMarkdown: string;
}

export interface SnapshotListResponse {
  snapshots: SnapshotSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface RestoreResult {
  documentId: string;
  restoredFromSnapshotId: string;
  newSnapshotId: string;
  message: string;
}
