import { PublicDocumentType } from '../../domain';

export class PublicDocumentPresenter {
  static toResponse(doc: PublicDocumentType) {
    return {
      document_id: doc.id,
      folder_id: doc.folderId,
      title: doc.title,
      content_markdown: doc.contentMarkdown,
      updated_at: doc.updatedAt.toISOString(),
    };
  }
}
