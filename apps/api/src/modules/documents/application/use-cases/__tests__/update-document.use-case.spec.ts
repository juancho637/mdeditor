import { UpdateDocumentUseCase } from '../update-document.use-case';
import { DocumentRepositoryInterface } from '../../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

describe('UpdateDocumentUseCase', () => {
  let useCase: UpdateDocumentUseCase;
  let documentRepository: jest.Mocked<DocumentRepositoryInterface>;
  let exception: jest.Mocked<ExceptionServiceInterface>;

  const mockDoc = {
    id: 'doc-1', folderId: 'fld-1', title: 'Old', slug: 'old',
    contentMarkdown: 'old content', createdBy: 'usr-1', createdAt: new Date(), updatedAt: new Date(),
  };

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
    useCase = new UpdateDocumentUseCase(documentRepository, exception);
  });

  it('should update content_markdown', async () => {
    documentRepository.findById.mockResolvedValue(mockDoc);
    documentRepository.update.mockResolvedValue({ ...mockDoc, contentMarkdown: '# Hello' });

    const result = await useCase.run('doc-1', { contentMarkdown: '# Hello' });

    expect(result.contentMarkdown).toBe('# Hello');
    expect(documentRepository.update).toHaveBeenCalledWith('doc-1', { contentMarkdown: '# Hello' });
  });

  it('should update title and regenerate slug', async () => {
    documentRepository.findById.mockResolvedValue(mockDoc);
    documentRepository.update.mockResolvedValue({ ...mockDoc, title: 'New Title', slug: 'new-title' });

    const result = await useCase.run('doc-1', { title: 'New Title' });

    expect(result.title).toBe('New Title');
    expect(documentRepository.update).toHaveBeenCalledWith('doc-1', { title: 'New Title', slug: 'new-title' });
  });

  it('should throw DOC001 when document not found', async () => {
    documentRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('nonexistent', { contentMarkdown: 'test' })).rejects.toThrow('Document not found.');
  });
});
