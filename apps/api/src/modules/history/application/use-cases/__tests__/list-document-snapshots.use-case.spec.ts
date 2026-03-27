import { ListDocumentSnapshotsUseCase } from '../list-document-snapshots.use-case';

describe('ListDocumentSnapshotsUseCase', () => {
  let useCase: ListDocumentSnapshotsUseCase;
  let mockHistoryRepository: any;
  let mockDocumentRepository: any;
  let mockCheckPermission: any;
  let mockException: any;

  const authUser = { id: 'user-1', email: 'test@test.com', name: 'Test', isAdmin: false };
  const document = { id: 'doc-1', folderId: 'folder-1', title: 'Test', slug: 'test', contentMarkdown: '', yjsState: null, createdBy: 'user-1', createdAt: new Date(), updatedAt: new Date() };

  beforeEach(() => {
    mockHistoryRepository = {
      findSnapshotsByDocumentId: jest.fn(),
    };
    mockDocumentRepository = {
      findById: jest.fn(),
    };
    mockCheckPermission = {
      run: jest.fn(),
    };
    mockException = {
      notFoundException: jest.fn((data) => new Error(data.message.codeError)),
      forbiddenException: jest.fn((data) => new Error(data.message.codeError)),
    };
    useCase = new ListDocumentSnapshotsUseCase(mockHistoryRepository, mockDocumentRepository, mockCheckPermission, mockException);
  });

  it('should return paginated snapshots for authorized user', async () => {
    const snapshots = [
      { id: 'snap-1', documentId: 'doc-1', authorId: 'user-1', authorName: 'Test', createdAt: new Date() },
    ];
    mockDocumentRepository.findById.mockResolvedValue(document);
    mockCheckPermission.run.mockResolvedValue('view');
    mockHistoryRepository.findSnapshotsByDocumentId.mockResolvedValue({ snapshots, total: 1 });

    const result = await useCase.run('doc-1', 1, 20, authUser);

    expect(result.snapshots).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(mockCheckPermission.run).toHaveBeenCalledWith('user-1', 'folder-1');
  });

  it('should throw not found if document does not exist', async () => {
    mockDocumentRepository.findById.mockResolvedValue(null);

    await expect(useCase.run('doc-999', 1, 20, authUser)).rejects.toThrow('DOC001');
    expect(mockException.notFoundException).toHaveBeenCalled();
  });

  it('should throw forbidden if user has no permission', async () => {
    mockDocumentRepository.findById.mockResolvedValue(document);
    mockCheckPermission.run.mockResolvedValue(null);

    await expect(useCase.run('doc-1', 1, 20, authUser)).rejects.toThrow('PRM002');
    expect(mockException.forbiddenException).toHaveBeenCalled();
  });

  it('should return empty list when no snapshots exist', async () => {
    mockDocumentRepository.findById.mockResolvedValue(document);
    mockCheckPermission.run.mockResolvedValue('view');
    mockHistoryRepository.findSnapshotsByDocumentId.mockResolvedValue({ snapshots: [], total: 0 });

    const result = await useCase.run('doc-1', 1, 20, authUser);

    expect(result.snapshots).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
