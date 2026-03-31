import {
  DocumentShareRepositoryInterface,
  DocumentRepositoryInterface,
  PublicDocumentType,
  documentErrorsCodes,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class GetDocumentByShareTokenUseCase {
  constructor(
    private readonly documentShareRepository: DocumentShareRepositoryInterface,
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(token: string): Promise<PublicDocumentType> {
    const share = await this.documentShareRepository.findByToken(token);
    if (!share) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC004,
        context: GetDocumentByShareTokenUseCase.name,
      });
    }

    const doc = await this.documentRepository.findById(share.documentId);
    if (!doc) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC004,
        context: GetDocumentByShareTokenUseCase.name,
      });
    }

    return {
      id: doc.id,
      folderId: doc.folderId,
      title: doc.title,
      contentMarkdown: doc.contentMarkdown,
      updatedAt: doc.updatedAt,
    };
  }
}
