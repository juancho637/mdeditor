import { DocumentType, DocumentSummaryType } from '../../domain';

export class DocumentPresenter {
  static toResponse(doc: DocumentType) {
    return {
      id: doc.id,
      folder_id: doc.folderId,
      title: doc.title,
      slug: doc.slug,
      content_markdown: doc.contentMarkdown,
      created_by: doc.createdBy,
      created_at: doc.createdAt.toISOString(),
      updated_at: doc.updatedAt.toISOString(),
    };
  }

  static toSummaryResponse(doc: DocumentSummaryType) {
    return {
      id: doc.id,
      folder_id: doc.folderId,
      title: doc.title,
      slug: doc.slug,
      created_at: doc.createdAt.toISOString(),
      updated_at: doc.updatedAt.toISOString(),
    };
  }
}
