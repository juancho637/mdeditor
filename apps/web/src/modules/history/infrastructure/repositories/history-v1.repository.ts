import { apiClient } from '@/common/adapters/api-client';
import type { HistoryRepository } from '../../domain/repositories/history-repository';
import type {
  SnapshotSummary,
  SnapshotDetail,
  SnapshotListResponse,
  RestoreResult,
} from '../../domain/entities/snapshot.entity';

interface SnapshotSummaryWire {
  id: string;
  document_id: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

interface SnapshotDetailWire extends SnapshotSummaryWire {
  content_markdown: string;
}

interface SnapshotListWire {
  snapshots: SnapshotSummaryWire[];
  total: number;
  page: number;
  limit: number;
}

function mapSummary(wire: SnapshotSummaryWire): SnapshotSummary {
  return {
    id: wire.id,
    documentId: wire.document_id,
    authorId: wire.author_id,
    authorName: wire.author_name,
    createdAt: wire.created_at,
  };
}

function mapDetail(wire: SnapshotDetailWire): SnapshotDetail {
  return {
    id: wire.id,
    documentId: wire.document_id,
    authorId: wire.author_id,
    authorName: wire.author_name,
    contentMarkdown: wire.content_markdown,
    createdAt: wire.created_at,
  };
}

export class HistoryV1Repository implements HistoryRepository {
  async listSnapshots(
    documentId: string,
    page: number,
    limit: number,
  ): Promise<SnapshotListResponse> {
    const response = await apiClient.get<SnapshotListWire>(
      `/api/documents/${documentId}/snapshots`,
      { params: { page, limit } },
    );
    const wire = response.data as SnapshotListWire;
    return {
      snapshots: wire.snapshots.map(mapSummary),
      total: wire.total,
      page: wire.page,
      limit: wire.limit,
    };
  }

  async getSnapshotDetail(
    documentId: string,
    snapshotId: string,
  ): Promise<SnapshotDetail> {
    const response = await apiClient.get<SnapshotDetailWire>(
      `/api/documents/${documentId}/snapshots/${snapshotId}`,
    );
    return mapDetail(response.data as SnapshotDetailWire);
  }
  async restoreSnapshot(
    documentId: string,
    snapshotId: string,
  ): Promise<RestoreResult> {
    const response = await apiClient.post<{
      document_id: string;
      restored_from_snapshot_id: string;
      new_snapshot_id: string;
      message: string;
    }>(`/api/documents/${documentId}/snapshots/${snapshotId}/restore`);
    const wire = response.data as {
      document_id: string;
      restored_from_snapshot_id: string;
      new_snapshot_id: string;
      message: string;
    };
    return {
      documentId: wire.document_id,
      restoredFromSnapshotId: wire.restored_from_snapshot_id,
      newSnapshotId: wire.new_snapshot_id,
      message: wire.message,
    };
  }
}

export const historyRepository = new HistoryV1Repository();
