import { DocumentRepositoryInterface, DocumentType, documentErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class GetDocumentByIdUseCase {
  private readonly context = GetDocumentByIdUseCase.name;

  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(id: string): Promise<DocumentType> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC001,
        context: this.context,
      });
    }
    return document;
  }
}
