import * as crypto from 'crypto';
import {
  DocumentShareRepositoryInterface,
  DocumentRepositoryInterface,
  DocumentShareType,
  documentErrorsCodes,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class CreateDocumentShareUseCase {
  constructor(
    private readonly documentShareRepository: DocumentShareRepositoryInterface,
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(documentId: string, createdBy: string): Promise<DocumentShareType> {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC001,
        context: CreateDocumentShareUseCase.name,
      });
    }

    const existing =
      await this.documentShareRepository.findByDocumentId(documentId);
    if (existing) return existing;

    const shareToken = crypto.randomBytes(32).toString('hex');
    return this.documentShareRepository.create({
      documentId,
      shareToken,
      createdBy,
    });
  }
}
