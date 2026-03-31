import { DocumentRepositoryInterface, SearchResultType } from '../../domain';

export class SearchDocumentsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
  ) {}

  async run(userId: string, query: string): Promise<SearchResultType[]> {
    if (!query || query.trim().length < 2) return [];
    return this.documentRepository.search(userId, query.trim());
  }
}
