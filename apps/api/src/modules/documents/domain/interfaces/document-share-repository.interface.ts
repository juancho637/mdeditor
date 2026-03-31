import { DocumentShareType } from '../types/document-share.type';

export interface DocumentShareRepositoryInterface {
  create(data: {
    documentId: string;
    shareToken: string;
    createdBy: string;
  }): Promise<DocumentShareType>;
  findByDocumentId(documentId: string): Promise<DocumentShareType | null>;
  findByToken(token: string): Promise<DocumentShareType | null>;
  deleteByDocumentId(documentId: string): Promise<void>;
}
