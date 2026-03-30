import { ReplaceDocumentContentUseCase } from '../replace-document-content.use-case';
import { PermissionLevel } from '@modules/permissions/domain';

describe('ReplaceDocumentContentUseCase', () => {
  let useCase: ReplaceDocumentContentUseCase;
  let mockDocumentRepository: { findById: jest.Mock };
  let mockCheckPermission: { run: jest.Mock };
  let mockSyncService: {
    getOrLoadDocument: jest.Mock;
    applyExternalUpdate: jest.Mock;
    releaseDocument: jest.Mock;
  };
  let mockException: {
    forbiddenException: jest.Mock;
    notFoundException: jest.Mock;
  };

  const userId = 'user-123';
  const documentId = '550e8400-e29b-41d4-a716-446655440001';
  const folderId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    mockDocumentRepository = { findById: jest.fn() };
    mockCheckPermission = { run: jest.fn() };
    mockSyncService = {
      getOrLoadDocument: jest.fn(),
      applyExternalUpdate: jest.fn(),
      releaseDocument: jest.fn(),
    };
    mockException = {
      forbiddenException: jest.fn().mockImplementation(({ message }) => ({
        response: { code_error: message.codeError, message: message.message },
      })),
      notFoundException: jest.fn().mockImplementation(({ message }) => ({
        response: { code_error: message.codeError, message: message.message },
      })),
    };

    useCase = new ReplaceDocumentContentUseCase(
      mockDocumentRepository as never,
      mockCheckPermission as never,
      mockSyncService as never,
      mockException as never,
    );
  });

  it('should update document content with EDIT permission', async () => {
    mockDocumentRepository.findById.mockResolvedValue({
      id: documentId,
      title: 'Test Doc',
      folderId,
    });
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.EDIT);
    const mockYText = { delete: jest.fn(), insert: jest.fn(), length: 10 };
    const mockYDoc = {
      getText: jest.fn().mockReturnValue(mockYText),
      transact: jest.fn((fn) => fn()),
      on: jest.fn(),
      off: jest.fn(),
    };
    mockSyncService.getOrLoadDocument.mockResolvedValue(mockYDoc);

    const result = await useCase.run(userId, documentId, '# Updated');

    expect(result).toEqual({
      id: documentId,
      title: 'Test Doc',
      updated: true,
    });
    expect(mockYText.delete).toHaveBeenCalledWith(0, 10);
    expect(mockYText.insert).toHaveBeenCalledWith(0, '# Updated');
    expect(mockSyncService.releaseDocument).toHaveBeenCalledWith(documentId);
  });

  it('should reject with AKY004 when document does not exist', async () => {
    mockDocumentRepository.findById.mockResolvedValue(null);

    await expect(useCase.run(userId, documentId, 'New')).rejects.toMatchObject({
      response: { code_error: 'AKY004' },
    });
  });

  it('should reject with AKY002 when user lacks EDIT permission', async () => {
    mockDocumentRepository.findById.mockResolvedValue({
      id: documentId,
      title: 'Test Doc',
      folderId,
    });
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.VIEW);

    await expect(useCase.run(userId, documentId, 'New')).rejects.toMatchObject({
      response: { code_error: 'AKY002' },
    });
  });

  it('should reject with AKY002 when user has no permission', async () => {
    mockDocumentRepository.findById.mockResolvedValue({
      id: documentId,
      title: 'Test Doc',
      folderId,
    });
    mockCheckPermission.run.mockResolvedValue(null);

    await expect(useCase.run(userId, documentId, 'New')).rejects.toMatchObject({
      response: { code_error: 'AKY002' },
    });
  });
});
