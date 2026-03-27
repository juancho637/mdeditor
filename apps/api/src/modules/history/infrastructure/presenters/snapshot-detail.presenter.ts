import { SnapshotDetailType } from '../../domain';

export class SnapshotDetailPresenter {
  static toResponse(snapshot: SnapshotDetailType) {
    return {
      id: snapshot.id,
      document_id: snapshot.documentId,
      author_id: snapshot.authorId,
      author_name: snapshot.authorName,
      content_markdown: snapshot.contentMarkdown,
      created_at: snapshot.createdAt instanceof Date ? snapshot.createdAt.toISOString() : snapshot.createdAt,
    };
  }
}
