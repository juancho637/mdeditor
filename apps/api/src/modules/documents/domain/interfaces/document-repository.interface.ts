import { DocumentType } from '../types/document.type';
import { DocumentSummaryType } from '../types/document-summary.type';

export interface DocumentRepositoryInterface {
  create(data: { folderId: string; title: string; slug: string; createdBy: string }): Promise<DocumentType>;
  findById(id: string): Promise<DocumentType | null>;
  findByFolderId(folderId: string): Promise<DocumentSummaryType[]>;
  update(id: string, data: { title?: string; slug?: string; contentMarkdown?: string }): Promise<DocumentType>;
  delete(id: string): Promise<void>;
}
