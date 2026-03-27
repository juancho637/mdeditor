import { SnapshotSummaryType } from '../../domain';

export class SnapshotSummaryPresenter {
  static toResponse(snapshot: SnapshotSummaryType) {
    return {
      id: snapshot.id,
      document_id: snapshot.documentId,
      author_id: snapshot.authorId,
      author_name: snapshot.authorName,
      created_at: snapshot.createdAt instanceof Date ? snapshot.createdAt.toISOString() : snapshot.createdAt,
    };
  }
}
