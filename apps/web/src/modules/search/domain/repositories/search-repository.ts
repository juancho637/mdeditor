import type { SearchResult } from '../types/search-result.type';

export interface SearchRepository {
  search(query: string): Promise<SearchResult[]>;
}
