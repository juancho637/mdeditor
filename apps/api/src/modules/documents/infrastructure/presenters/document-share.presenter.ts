import { DocumentShareType } from '../../domain';

export class DocumentSharePresenter {
  static toResponse(share: DocumentShareType, baseUrl = '') {
    return {
      share_token: share.shareToken,
      document_id: share.documentId,
      created_at: share.createdAt.toISOString(),
      share_url: `${baseUrl}/p/${share.shareToken}`,
    };
  }
}
