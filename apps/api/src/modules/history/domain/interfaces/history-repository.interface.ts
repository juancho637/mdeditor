import { SnapshotSummaryType } from '../types/snapshot-summary.type';
import { SnapshotDetailType } from '../types/snapshot-detail.type';

export interface HistoryRepositoryInterface {
  findSnapshotsByDocumentId(
    documentId: string,
    page: number,
    limit: number,
  ): Promise<{ snapshots: SnapshotSummaryType[]; total: number }>;

  findSnapshotById(snapshotId: string): Promise<SnapshotDetailType | null>;

  saveSnapshot(
    documentId: string,
    yjsSnapshot: Buffer,
    contentMarkdown: string,
    authorId: string,
  ): Promise<string>;
}
