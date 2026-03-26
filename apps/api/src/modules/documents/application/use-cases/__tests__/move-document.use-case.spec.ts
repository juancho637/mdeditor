import { MoveDocumentUseCase } from '../move-document.use-case';
import { DocumentRepositoryInterface } from '../../../domain';
import { FolderRepositoryInterface } from '@modules/folders/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('MoveDocumentUseCase', () => {
  let useCase: MoveDocumentUseCase;
  let documentRepository: jest.Mocked<DocumentRepositoryInterface>;
  let folderRepository: jest.Mocked<FolderRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  const mockDoc = {
    id: 'doc-1', folderId: 'fld-1', title: 'Brief', slug: 'brief',
    contentMarkdown: '', createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
  };

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
      badRequestException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      unauthorizedException: jest.fn(), forbiddenException: jest.fn(),
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(), internalServerErrorException: jest.fn(),
    };
    useCase = new MoveDocumentUseCase(documentRepository, folderRepository, exception);
  });

  it('should move document to target folder', async () => {
    documentRepository.findById.mockResolvedValue(mockDoc);
    folderRepository.findById.mockResolvedValue({
      id: 'fld-2', parentId: null, name: 'Target', slug: 'target',
      createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });
    documentRepository.update.mockResolvedValue({ ...mockDoc, folderId: 'fld-2' });

    const result = await useCase.run('doc-1', 'fld-2');

    expect(result.folderId).toBe('fld-2');
    expect(documentRepository.update).toHaveBeenCalledWith('doc-1', { folderId: 'fld-2' });
  });

  it('should throw DOC001 when document not found', async () => {
    documentRepository.findById.mockResolvedValue(null);

    await expect(useCase.run('nonexistent', 'fld-2')).rejects.toThrow('Document not found.');
  });

  it('should throw DOC003 when moving to same folder', async () => {
    documentRepository.findById.mockResolvedValue(mockDoc);

    await expect(useCase.run('doc-1', 'fld-1')).rejects.toThrow('Document is already in this folder.');
  });

  it('should throw FLD001 when target folder not found', async () => {
    documentRepository.findById.mockResolvedValue(mockDoc);
    folderRepository.findById.mockResolvedValue(null);

    await expect(useCase.run('doc-1', 'nonexistent')).rejects.toThrow('Folder not found.');
  });
});
