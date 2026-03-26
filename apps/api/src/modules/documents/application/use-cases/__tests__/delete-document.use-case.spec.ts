import { DeleteDocumentUseCase } from '../delete-document.use-case';
import { DocumentRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('DeleteDocumentUseCase', () => {
  let useCase: DeleteDocumentUseCase;
  let documentRepository: jest.Mocked<DocumentRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  beforeEach(() => {
    documentRepository = {
      create: jest.fn(), findById: jest.fn(), findByFolderId: jest.fn(),
      update: jest.fn(), delete: jest.fn(),
    };
    exception = {
      badRequestException: jest.fn(), unauthorizedException: jest.fn(), forbiddenException: jest.fn(),
      notFoundException: jest.fn().mockImplementation(({ message }) => new Error(message.message)),
      conflictException: jest.fn(), internalServerErrorException: jest.fn(),
    };
    useCase = new DeleteDocumentUseCase(documentRepository, exception);
  });

  it('should delete document when it exists', async () => {
    documentRepository.findById.mockResolvedValue({
      id: 'doc-1', folderId: 'fld-1', title: 'ToDelete', slug: 'to-delete',
      contentMarkdown: '', createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
    });

    await useCase.run('doc-1');
    expect(documentRepository.delete).toHaveBeenCalledWith('doc-1');
  });

  it('should throw DOC001 when document not found', async () => {
    documentRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('nonexistent')).rejects.toThrow('Document not found.');
    expect(documentRepository.delete).not.toHaveBeenCalled();
  });
});
