import { ListDocumentsUseCase } from '../list-documents.use-case';
import { FolderRepositoryInterface } from '@modules/folders/domain/interfaces/folder-repository.interface';
import { DocumentRepositoryInterface } from '@modules/documents/domain/interfaces/document-repository.interface';
import { CheckPermissionUseCase } from '@modules/permissions/application/use-cases/check-permission.use-case';
import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';
import { PermissionLevel } from '@modules/permissions/domain/enums/permission-level.enum';
import { mcpErrorsCodes } from '../../../domain';

describe('ListDocumentsUseCase', () => {
  let useCase: ListDocumentsUseCase;
  let folderRepository: jest.Mocked<FolderRepositoryInterface>;
  let documentRepository: jest.Mocked<DocumentRepositoryInterface>;
  let checkPermission: jest.Mocked<CheckPermissionUseCase>;
  let exceptionService: jest.Mocked<ExceptionServiceInterface>;

  const mockFolder = { id: 'folder-1', name: 'Dev', slug: 'dev', parentId: null, createdBy: 'admin', createdAt: new Date(), updatedAt: new Date() };
  const mockDocuments = [
    { id: 'doc-1', folderId: 'folder-1', title: 'README', slug: 'readme', createdAt: new Date(), updatedAt: new Date() },
    { id: 'doc-2', folderId: 'folder-1', title: 'Guide', slug: 'guide', createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(() => {
    folderRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByNameInParent: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getPath: jest.fn(),
    };

    documentRepository = {
      findById: jest.fn(),
      findByFolderId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    checkPermission = { run: jest.fn() } as any;

    exceptionService = {
      unauthorizedException: jest.fn().mockReturnValue(new Error('Unauthorized')),
      badRequestException: jest.fn().mockReturnValue(new Error('Bad Request')),
      forbiddenException: jest.fn().mockReturnValue(new Error('Forbidden')),
      notFoundException: jest.fn().mockReturnValue(new Error('Not Found')),
      conflictException: jest.fn().mockReturnValue(new Error('Conflict')),
      internalServerErrorException: jest.fn().mockReturnValue(new Error('Internal')),
    };

    useCase = new ListDocumentsUseCase(folderRepository, documentRepository, checkPermission, exceptionService);
  });

  it('should list documents when user has permission', async () => {
    folderRepository.findById.mockResolvedValue(mockFolder);
    checkPermission.run.mockResolvedValue(PermissionLevel.VIEW);
    documentRepository.findByFolderId.mockResolvedValue(mockDocuments);

    const result = await useCase.run('user-id', 'folder-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'doc-1',
      title: 'README',
      slug: 'readme',
      updatedAt: mockDocuments[0].updatedAt,
    });
  });

  it('should throw MCP003 when folder not found', async () => {
    folderRepository.findById.mockResolvedValue(null);

    await expect(useCase.run('user-id', 'nonexistent')).rejects.toThrow();
    expect(exceptionService.notFoundException).toHaveBeenCalledWith({
      message: mcpErrorsCodes.MCP003,
      context: 'ListDocumentsUseCase',
    });
  });

  it('should throw MCP002 when user has no permission', async () => {
    folderRepository.findById.mockResolvedValue(mockFolder);
    checkPermission.run.mockResolvedValue(null);

    await expect(useCase.run('user-id', 'folder-1')).rejects.toThrow();
    expect(exceptionService.forbiddenException).toHaveBeenCalledWith({
      message: {
        ...mcpErrorsCodes.MCP002,
        serverMessage: 'User user-id lacks permission on folder folder-1',
      },
      context: 'ListDocumentsUseCase',
    });
  });
});
