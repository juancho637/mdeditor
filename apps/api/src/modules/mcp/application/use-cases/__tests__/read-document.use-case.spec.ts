import { ReadDocumentUseCase } from '../read-document.use-case';
import { DocumentRepositoryInterface } from '@modules/documents/domain/interfaces/document-repository.interface';
import { CheckPermissionUseCase } from '@modules/permissions/application/use-cases/check-permission.use-case';
import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';
import { PermissionLevel } from '@modules/permissions/domain/enums/permission-level.enum';
import { mcpErrorsCodes } from '../../../domain';

describe('ReadDocumentUseCase', () => {
  let useCase: ReadDocumentUseCase;
  let documentRepository: jest.Mocked<DocumentRepositoryInterface>;
  let checkPermission: jest.Mocked<CheckPermissionUseCase>;
  let exceptionService: jest.Mocked<ExceptionServiceInterface>;

  const mockDocument = {
    id: 'doc-1',
    folderId: 'folder-1',
    title: 'README',
    slug: 'readme',
    contentMarkdown: '# Hello World',
    yjsState: null,
    createdBy: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
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

    useCase = new ReadDocumentUseCase(documentRepository, checkPermission, exceptionService);
  });

  it('should return document content when user has permission', async () => {
    documentRepository.findById.mockResolvedValue(mockDocument);
    checkPermission.run.mockResolvedValue(PermissionLevel.VIEW);

    const result = await useCase.run('user-id', 'doc-1');

    expect(result).toEqual({
      id: 'doc-1',
      title: 'README',
      slug: 'readme',
      contentMarkdown: '# Hello World',
      folderId: 'folder-1',
      updatedAt: mockDocument.updatedAt,
    });
  });

  it('should throw MCP004 when document not found', async () => {
    documentRepository.findById.mockResolvedValue(null);

    await expect(useCase.run('user-id', 'nonexistent')).rejects.toThrow();
    expect(exceptionService.notFoundException).toHaveBeenCalledWith({
      message: mcpErrorsCodes.MCP004,
      context: 'ReadDocumentUseCase',
    });
  });

  it('should throw MCP002 when user has no permission', async () => {
    documentRepository.findById.mockResolvedValue(mockDocument);
    checkPermission.run.mockResolvedValue(null);

    await expect(useCase.run('user-id', 'doc-1')).rejects.toThrow();
    expect(exceptionService.forbiddenException).toHaveBeenCalledWith({
      message: {
        ...mcpErrorsCodes.MCP002,
        serverMessage: 'User user-id lacks permission on folder folder-1',
      },
      context: 'ReadDocumentUseCase',
    });
  });
});
