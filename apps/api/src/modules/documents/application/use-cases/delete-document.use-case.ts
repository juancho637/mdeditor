import { DocumentRepositoryInterface, documentErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class DeleteDocumentUseCase {
  private readonly context = DeleteDocumentUseCase.name;

  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(id: string): Promise<void> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC001,
        context: this.context,
      });
    }
    await this.documentRepository.delete(id);
  }
}
