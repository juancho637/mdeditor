import { DocumentShareRepositoryInterface } from '../../domain';

export class DeleteDocumentShareUseCase {
  constructor(
    private readonly documentShareRepository: DocumentShareRepositoryInterface,
  ) {}

  async run(documentId: string): Promise<void> {
    await this.documentShareRepository.deleteByDocumentId(documentId);
  }
}
