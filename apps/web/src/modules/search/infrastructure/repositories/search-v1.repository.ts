import { apiClient } from '@/common/adapters/api-client';
import type { SearchRepository } from '../../domain/repositories/search-repository';
import type { SearchResult } from '../../domain/types/search-result.type';

interface SearchWireResult {
  id: string;
  folder_id: string;
  folder_name: string;
  title: string;
  slug: string;
  preview: string;
}

function mapResult(wire: SearchWireResult): SearchResult {
  return {
    id: wire.id,
    folderId: wire.folder_id,
    folderName: wire.folder_name,
    title: wire.title,
    slug: wire.slug,
    preview: wire.preview,
  };
}

export class SearchV1Repository implements SearchRepository {
  async search(query: string): Promise<SearchResult[]> {
    const response = await apiClient.get<SearchWireResult[]>(
      '/api/documents/search',
      { params: { q: query } },
    );
    return (response.data as SearchWireResult[]).map(mapResult);
  }
}

export const searchRepository = new SearchV1Repository();
