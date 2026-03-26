import type { Document } from '../types/document.type';
import type { DocumentSummary } from '../types/document-summary.type';

export interface DocumentRepository {
  create(title: string, folderId: string): Promise<Document>;
  getById(id: string): Promise<Document>;
  update(id: string, data: { title?: string; contentMarkdown?: string }): Promise<Document>;
  delete(id: string): Promise<void>;
  listByFolder(folderId: string): Promise<DocumentSummary[]>;
}
