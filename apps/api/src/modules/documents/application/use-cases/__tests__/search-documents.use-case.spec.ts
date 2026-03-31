import { SearchDocumentsUseCase } from '../search-documents.use-case';
import { DocumentRepositoryInterface, SearchResultType } from '../../../domain';

const mockResult: SearchResultType = {
  id: 'doc-1',
  folderId: 'folder-1',
  folderName: 'My Folder',
  title: 'TypeScript Guide',
  slug: 'typescript-guide',
  preview: '...intro to <b>TypeScript</b>...',
};

const mockRepo = {
  search: jest.fn(),
} as unknown as jest.Mocked<DocumentRepositoryInterface>;

describe('SearchDocumentsUseCase', () => {
  let useCase: SearchDocumentsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SearchDocumentsUseCase(mockRepo);
  });

  it('returns empty array when query is empty', async () => {
    const result = await useCase.run('user-1', '');
    expect(result).toEqual([]);
    expect(mockRepo.search).not.toHaveBeenCalled();
  });

  it('returns empty array when query is a single character', async () => {
    const result = await useCase.run('user-1', 'a');
    expect(result).toEqual([]);
    expect(mockRepo.search).not.toHaveBeenCalled();
  });

  it('calls repository with trimmed query when query has 2+ chars', async () => {
    mockRepo.search.mockResolvedValue([mockResult]);
    const result = await useCase.run('user-1', '  typescript  ');
    expect(mockRepo.search).toHaveBeenCalledWith('user-1', 'typescript');
    expect(result).toEqual([mockResult]);
  });

  it('returns empty array when repository returns no results', async () => {
    mockRepo.search.mockResolvedValue([]);
    const result = await useCase.run('user-1', 'nonexistent');
    expect(result).toEqual([]);
  });
});
