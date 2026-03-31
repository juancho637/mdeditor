import {
  DocumentShareRepositoryInterface,
  DocumentShareType,
} from '../../domain';

export class GetDocumentShareUseCase {
  constructor(
    private readonly documentShareRepository: DocumentShareRepositoryInterface,
  ) {}

  async run(documentId: string): Promise<DocumentShareType | null> {
    return this.documentShareRepository.findByDocumentId(documentId);
  }
}
