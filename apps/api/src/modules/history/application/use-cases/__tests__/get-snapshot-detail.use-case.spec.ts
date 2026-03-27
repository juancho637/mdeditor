import { GetSnapshotDetailUseCase } from '../get-snapshot-detail.use-case';

describe('GetSnapshotDetailUseCase', () => {
  let useCase: GetSnapshotDetailUseCase;
  let mockHistoryRepository: any;
  let mockDocumentRepository: any;
  let mockCheckPermission: any;
  let mockException: any;

  const authUser = { id: 'user-1', email: 'test@test.com', name: 'Test', isAdmin: false };
  const snapshot = { id: 'snap-1', documentId: 'doc-1', authorId: 'user-1', authorName: 'Test', contentMarkdown: '# Hello', createdAt: new Date() };
  const document = { id: 'doc-1', folderId: 'folder-1', title: 'Test', slug: 'test', contentMarkdown: '', yjsState: null, createdBy: 'user-1', createdAt: new Date(), updatedAt: new Date() };

  beforeEach(() => {
    mockHistoryRepository = {
      findSnapshotById: jest.fn(),
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
    useCase = new GetSnapshotDetailUseCase(mockHistoryRepository, mockDocumentRepository, mockCheckPermission, mockException);
  });

  it('should return snapshot detail for authorized user', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(snapshot);
    mockDocumentRepository.findById.mockResolvedValue(document);
    mockCheckPermission.run.mockResolvedValue('view');

    const result = await useCase.run('doc-1', 'snap-1', authUser);

    expect(result).toEqual(snapshot);
    expect(mockCheckPermission.run).toHaveBeenCalledWith('user-1', 'folder-1');
  });

  it('should throw HST001 if snapshot does not exist', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(null);

    await expect(useCase.run('doc-1', 'snap-999', authUser)).rejects.toThrow('HST001');
    expect(mockException.notFoundException).toHaveBeenCalled();
  });

  it('should throw HST001 if snapshot belongs to different document', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(snapshot);

    await expect(useCase.run('doc-other', 'snap-1', authUser)).rejects.toThrow('HST001');
    expect(mockException.notFoundException).toHaveBeenCalled();
  });

  it('should throw forbidden if user has no permission', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(snapshot);
    mockDocumentRepository.findById.mockResolvedValue(document);
    mockCheckPermission.run.mockResolvedValue(null);

    await expect(useCase.run('doc-1', 'snap-1', authUser)).rejects.toThrow('PRM001');
    expect(mockException.forbiddenException).toHaveBeenCalled();
  });
});
