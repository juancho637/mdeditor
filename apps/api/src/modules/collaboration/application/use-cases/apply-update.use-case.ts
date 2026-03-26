import { DocumentUpdateRepositoryInterface } from '../../domain';

export class ApplyUpdateUseCase {
  constructor(
    private readonly updateRepository: DocumentUpdateRepositoryInterface,
  ) {}

  async run(documentId: string, update: Uint8Array, authorId: string): Promise<void> {
    await this.updateRepository.saveUpdate(documentId, update, authorId);
  }
}
