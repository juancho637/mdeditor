import { DocumentRepositoryInterface, DocumentType, documentErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

function generateSlug(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export class UpdateDocumentUseCase {
  private readonly context = UpdateDocumentUseCase.name;

  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(id: string, data: { title?: string; contentMarkdown?: string }): Promise<DocumentType> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC001,
        context: this.context,
      });
    }

    const updateData: { title?: string; slug?: string; contentMarkdown?: string } = {};
    if (data.title !== undefined) {
      updateData.title = data.title.trim();
      updateData.slug = generateSlug(data.title);
    }
    if (data.contentMarkdown !== undefined) {
      updateData.contentMarkdown = data.contentMarkdown;
    }

    return this.documentRepository.update(id, updateData);
  }
}
