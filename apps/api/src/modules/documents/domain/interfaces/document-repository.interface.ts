import { DocumentType } from '../types/document.type';
import { DocumentSummaryType } from '../types/document-summary.type';
import { SearchResultType } from '../types/search-result.type';

export interface DocumentRepositoryInterface {
  create(data: {
    folderId: string;
    title: string;
    slug: string;
    createdBy: string;
  }): Promise<DocumentType>;
  findById(id: string): Promise<DocumentType | null>;
  findByFolderId(folderId: string): Promise<DocumentSummaryType[]>;
  update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      contentMarkdown?: string;
      folderId?: string;
      yjsState?: Buffer;
    },
  ): Promise<DocumentType>;
  delete(id: string): Promise<void>;
  search(userId: string, query: string): Promise<SearchResultType[]>;
}
