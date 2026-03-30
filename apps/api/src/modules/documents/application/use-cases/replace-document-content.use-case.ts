import { ExceptionServiceInterface } from '@common/exception/domain';
import { mcpErrorCodes } from '@common/mcp/domain/mcp-errors.codes';
import { DocumentRepositoryInterface } from '../../domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { PermissionLevel } from '@modules/permissions/domain';
import {
  DocumentSyncServiceInterface,
  ReplaceDocumentContentResultType,
} from '../../domain';

export class ReplaceDocumentContentUseCase {
  private readonly context = ReplaceDocumentContentUseCase.name;

  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly syncService: DocumentSyncServiceInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(
    userId: string,
    documentId: string,
    content: string,
  ): Promise<ReplaceDocumentContentResultType> {
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
    if (permission !== PermissionLevel.EDIT) {
      throw this.exception.forbiddenException({
        message: {
          ...mcpErrorCodes.PERMISSION_DENIED,
          serverMessage: `User ${userId} lacks EDIT permission on folder ${document.folderId}`,
        },
        context: this.context,
      });
    }

    const yDoc = await this.syncService.getOrLoadDocument(documentId);

    try {
      let capturedUpdate: Uint8Array | null = null;
      const observer = (update: Uint8Array) => {
        capturedUpdate = update;
      };
      yDoc.on('update', observer);

      yDoc.transact(() => {
        const yText = yDoc.getText('content');
        yText.delete(0, yText.length);
        yText.insert(0, content);
      });

      yDoc.off('update', observer);

      if (capturedUpdate) {
        await this.syncService.applyExternalUpdate(
          documentId,
          capturedUpdate,
          userId,
        );
      }
    } finally {
      await this.syncService.releaseDocument(documentId);
    }

    return {
      id: document.id,
      title: document.title,
      updated: true,
    };
  }
}
