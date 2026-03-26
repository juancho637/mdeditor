import { DocumentRepositoryInterface, DocumentSummaryType } from '../../domain';

export class ListDocumentsByFolderUseCase {
  constructor(private readonly documentRepository: DocumentRepositoryInterface) {}

  async run(folderId: string): Promise<DocumentSummaryType[]> {
    return this.documentRepository.findByFolderId(folderId);
  }
}
