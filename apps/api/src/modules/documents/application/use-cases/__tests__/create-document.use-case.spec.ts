import { CreateDocumentUseCase } from '../create-document.use-case';
import { DocumentRepositoryInterface } from '../../../domain';
import { FolderRepositoryInterface } from '@modules/folders/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('CreateDocumentUseCase', () => {
  let useCase: CreateDocumentUseCase;
  let documentRepository: jest.Mocked<DocumentRepositoryInterface>;
  let folderRepository: jest.Mocked<FolderRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    documentRepository = {
      create: jest.fn(), findById: jest.fn(), findByFolderId: jest.fn(),
      update: jest.fn(), delete: jest.fn(),
    };
    folderRepository = {
      create: jest.fn(), findById: jest.fn(), findByNameInParent: jest.fn(),
      findAll: jest.fn(), update: jest.fn(), delete: jest.fn(), getPath: jest.fn(),
    };
    exception = {
      badRequestException: jest.fn(), unauthorizedException: jest.fn(), forbiddenException: jest.fn(),
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(), internalServerErrorException: jest.fn(),
    };
    useCase = new CreateDocumentUseCase(documentRepository, folderRepository, exception);
  });

  it('should create document in existing folder', async () => {
    folderRepository.findById.mockResolvedValue({
      id: 'fld-1', parentId: null, name: 'Root', slug: 'root',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });
    documentRepository.create.mockResolvedValue({
      id: 'doc-1', folderId: 'fld-1', title: 'Brief', slug: 'brief',
      contentMarkdown: '', createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await useCase.run({ title: 'Brief', folderId: 'fld-1', createdBy: 'usr-1' });

    expect(result.title).toBe('Brief');
    expect(result.folderId).toBe('fld-1');
    expect(documentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Brief', slug: 'brief', folderId: 'fld-1' }),
    );
  });

  it('should throw FLD001 when folder does not exist', async () => {
    folderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.run({ title: 'Brief', folderId: 'nonexistent', createdBy: 'usr-1' }),
    ).rejects.toThrow('Folder not found.');

    expect(documentRepository.create).not.toHaveBeenCalled();
  });
});
