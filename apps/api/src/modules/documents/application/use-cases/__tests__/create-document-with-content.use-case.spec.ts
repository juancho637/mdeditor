import { CreateDocumentWithContentUseCase } from '../create-document-with-content.use-case';
import { PermissionLevel } from '@modules/permissions/domain';

describe('CreateDocumentWithContentUseCase', () => {
  let useCase: CreateDocumentWithContentUseCase;
  let mockCreateDocumentUseCase: { run: jest.Mock };
  let mockCheckPermission: { run: jest.Mock };
  let mockSyncService: {
    getOrLoadDocument: jest.Mock;
    applyExternalUpdate: jest.Mock;
    releaseDocument: jest.Mock;
  };
  let mockException: { forbiddenException: jest.Mock };

  const userId = 'user-123';
  const folderId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    mockCreateDocumentUseCase = { run: jest.fn() };
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
    };

    useCase = new CreateDocumentWithContentUseCase(
      mockCreateDocumentUseCase as never,
      mockCheckPermission as never,
      mockSyncService as never,
      mockException as never,
    );
  });

  it('should create document with EDIT permission', async () => {
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.EDIT);
    mockCreateDocumentUseCase.run.mockResolvedValue({
      id: 'doc-1',
      title: 'Test',
      slug: 'test',
      folderId,
    });

    const result = await useCase.run({ userId, folderId, title: 'Test' });

    expect(result).toEqual({
      id: 'doc-1',
      title: 'Test',
      slug: 'test',
      folderId,
    });
  });

  it('should reject with AKY002 when user has VIEW permission', async () => {
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.VIEW);

    await expect(
      useCase.run({ userId, folderId, title: 'Test' }),
    ).rejects.toMatchObject({ response: { code_error: 'AKY002' } });
  });

  it('should reject with AKY002 when user has no permission', async () => {
    mockCheckPermission.run.mockResolvedValue(null);

    await expect(
      useCase.run({ userId, folderId, title: 'Test' }),
    ).rejects.toMatchObject({ response: { code_error: 'AKY002' } });
  });

  it('should set content via Y.Doc when content is provided', async () => {
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.EDIT);
    mockCreateDocumentUseCase.run.mockResolvedValue({
      id: 'doc-1',
      title: 'Test',
      slug: 'test',
      folderId,
    });
    const mockYDoc = {
      getText: jest.fn().mockReturnValue({ insert: jest.fn() }),
      transact: jest.fn((fn) => fn()),
      on: jest.fn(),
      off: jest.fn(),
    };
    mockSyncService.getOrLoadDocument.mockResolvedValue(mockYDoc);

    await useCase.run({ userId, folderId, title: 'Test', content: '# Hello' });

    expect(mockSyncService.getOrLoadDocument).toHaveBeenCalledWith('doc-1');
    expect(mockSyncService.releaseDocument).toHaveBeenCalledWith('doc-1');
  });

  it('should not load Y.Doc when content is not provided', async () => {
    mockCheckPermission.run.mockResolvedValue(PermissionLevel.EDIT);
    mockCreateDocumentUseCase.run.mockResolvedValue({
      id: 'doc-1',
      title: 'Test',
      slug: 'test',
      folderId,
    });

    await useCase.run({ userId, folderId, title: 'Test' });

    expect(mockSyncService.getOrLoadDocument).not.toHaveBeenCalled();
  });
});
