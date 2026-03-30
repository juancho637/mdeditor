import { RestoreSnapshotUseCase } from '../restore-snapshot.use-case';
import { HistoryRepositoryInterface } from '../../../domain';
import { DocumentRepositoryInterface } from '@modules/documents/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { DocumentSyncServiceInterface } from '@modules/collaboration/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('RestoreSnapshotUseCase', () => {
  let useCase: RestoreSnapshotUseCase;
  let mockHistoryRepository: jest.Mocked<
    Pick<HistoryRepositoryInterface, 'findSnapshotById' | 'saveSnapshot'>
  >;
  let mockDocumentRepository: jest.Mocked<
    Pick<DocumentRepositoryInterface, 'findById' | 'update'>
  >;
  let mockCheckPermission: jest.Mocked<Pick<CheckPermissionUseCase, 'run'>>;
  let mockSyncService: jest.Mocked<
    Pick<DocumentSyncServiceInterface, 'forceDocumentReload'>
  >;
  let mockException: jest.Mocked<
    Pick<ExceptionServiceInterface, 'notFoundException' | 'forbiddenException'>
  >;

  const authUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test',
    isAdmin: false,
  };
  const snapshot = {
    id: 'snap-1',
    documentId: 'doc-1',
    authorId: 'user-2',
    authorName: 'Author',
    contentMarkdown: '# Restored content',
    createdAt: new Date(),
  };
  const document = {
    id: 'doc-1',
    folderId: 'folder-1',
    title: 'Test',
    slug: 'test',
    contentMarkdown: '# Current content',
    yjsState: null,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockHistoryRepository = {
      findSnapshotById: jest.fn(),
      saveSnapshot: jest.fn(),
    };
    mockDocumentRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    mockCheckPermission = {
      run: jest.fn(),
    };
    mockSyncService = {
      forceDocumentReload: jest.fn(),
    };
    mockException = {
      notFoundException: jest.fn((data) => new Error(data.message.codeError)),
      forbiddenException: jest.fn((data) => new Error(data.message.codeError)),
    };
    useCase = new RestoreSnapshotUseCase(
      mockHistoryRepository,
      mockDocumentRepository,
      mockCheckPermission,
      mockSyncService,
      mockException,
    );
  });

  it('should restore snapshot and create new snapshot entry', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(snapshot);
    mockDocumentRepository.findById.mockResolvedValue(document);
    mockCheckPermission.run.mockResolvedValue('edit');
    mockDocumentRepository.update.mockResolvedValue(document);
    mockHistoryRepository.saveSnapshot.mockResolvedValue('new-snap-id');

    const result = await useCase.run('doc-1', 'snap-1', authUser);

    expect(result.documentId).toBe('doc-1');
    expect(result.restoredFromSnapshotId).toBe('snap-1');
    expect(result.newSnapshotId).toBe('new-snap-id');
    expect(result.contentMarkdown).toBe('# Restored content');

    expect(mockDocumentRepository.update).toHaveBeenCalledWith('doc-1', {
      contentMarkdown: '# Restored content',
      yjsState: expect.any(Buffer),
    });
    expect(mockHistoryRepository.saveSnapshot).toHaveBeenCalledWith(
      'doc-1',
      expect.any(Buffer),
      '# Restored content',
      'user-1',
    );
    expect(mockSyncService.forceDocumentReload).toHaveBeenCalledWith('doc-1');
  });

  it('should throw HST001 if snapshot does not exist', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(null);

    await expect(useCase.run('doc-1', 'snap-999', authUser)).rejects.toThrow(
      'HST001',
    );
    expect(mockException.notFoundException).toHaveBeenCalled();
  });

  it('should throw HST001 if snapshot belongs to different document', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(snapshot);

    await expect(useCase.run('doc-other', 'snap-1', authUser)).rejects.toThrow(
      'HST001',
    );
    expect(mockException.notFoundException).toHaveBeenCalled();
  });

  it('should throw DOC001 if document does not exist', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(snapshot);
    mockDocumentRepository.findById.mockResolvedValue(null);

    await expect(useCase.run('doc-1', 'snap-1', authUser)).rejects.toThrow(
      'DOC001',
    );
    expect(mockException.notFoundException).toHaveBeenCalled();
  });

  it('should throw PRM002 if user has no permission', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(snapshot);
    mockDocumentRepository.findById.mockResolvedValue(document);
    mockCheckPermission.run.mockResolvedValue(null);

    await expect(useCase.run('doc-1', 'snap-1', authUser)).rejects.toThrow(
      'PRM002',
    );
    expect(mockException.forbiddenException).toHaveBeenCalled();
  });

  it('should throw PRM002 if user has only VIEW permission', async () => {
    mockHistoryRepository.findSnapshotById.mockResolvedValue(snapshot);
    mockDocumentRepository.findById.mockResolvedValue(document);
    mockCheckPermission.run.mockResolvedValue('view');

    await expect(useCase.run('doc-1', 'snap-1', authUser)).rejects.toThrow(
      'PRM002',
    );
    expect(mockException.forbiddenException).toHaveBeenCalled();
  });
});
