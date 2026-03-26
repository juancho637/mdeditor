import { FolderRepositoryInterface, folderErrorsCodes } from '@modules/folders/domain';
import { DocumentRepositoryInterface, DocumentType, documentErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class MoveDocumentUseCase {
  private readonly context = MoveDocumentUseCase.name;

  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(documentId: string, targetFolderId: string): Promise<DocumentType> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC001,
        context: this.context,
      });
    }

    if (document.folderId === targetFolderId) {
      throw this.exception.badRequestException({
        message: documentErrorsCodes.DOC003,
        context: this.context,
      });
    }

    const targetFolder = await this.folderRepository.findById(targetFolderId);
    if (!targetFolder) {
      throw this.exception.notFoundException({
        message: folderErrorsCodes.FLD001,
        context: this.context,
      });
    }

    return this.documentRepository.update(documentId, { folderId: targetFolderId });
  }
}
