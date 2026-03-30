import { ExceptionServiceInterface } from '@common/exception/domain';
import { mcpErrorCodes } from '@common/mcp/domain/mcp-errors.codes';
import { DocumentRepositoryInterface } from '../../domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { DocumentSyncServiceInterface } from '../../domain';

export class ReadDocumentContentUseCase {
  private readonly context = ReadDocumentContentUseCase.name;

  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly syncService: DocumentSyncServiceInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(userId: string, documentId: string): Promise<string> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw this.exception.notFoundException({
        message: mcpErrorCodes.DOCUMENT_NOT_FOUND,
        context: this.context,
      });
    }

    const permission = await this.checkPermission.run(
      userId,
      document.folderId,
    );
    if (permission === null) {
      throw this.exception.forbiddenException({
        message: {
          ...mcpErrorCodes.PERMISSION_DENIED,
          serverMessage: `User ${userId} lacks permission on folder ${document.folderId}`,
        },
        context: this.context,
      });
    }

    let content = document.contentMarkdown;
    try {
      const yDoc = await this.syncService.getOrLoadDocument(documentId);
      this.syncService.addConnection(documentId);
      const yText = yDoc.getText('content');
      content = yText.toString();
      await this.syncService.releaseDocument(documentId);
    } catch {
      // Fall back to DB content if Y.Doc loading fails
    }

    return content;
  }
}
