import { ExceptionServiceInterface } from '@common/exception/domain';
import { mcpErrorCodes } from '@common/mcp/domain/mcp-errors.codes';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { PermissionLevel } from '@modules/permissions/domain';
import { CreateDocumentUseCase } from './create-document.use-case';
import { DocumentType } from '../../domain';
import { DocumentSyncServiceInterface } from '../../domain';

export class CreateDocumentWithContentUseCase {
  private readonly context = CreateDocumentWithContentUseCase.name;

  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly syncService: DocumentSyncServiceInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: {
    userId: string;
    folderId: string;
    title: string;
    content?: string;
  }): Promise<Pick<DocumentType, 'id' | 'title' | 'slug' | 'folderId'>> {
    const permission = await this.checkPermission.run(
      data.userId,
      data.folderId,
    );
    if (permission !== PermissionLevel.EDIT) {
      throw this.exception.forbiddenException({
        message: {
          ...mcpErrorCodes.PERMISSION_DENIED,
          serverMessage: `User ${data.userId} lacks EDIT permission on folder ${data.folderId}`,
        },
        context: this.context,
      });
    }

    const document = await this.createDocumentUseCase.run({
      title: data.title,
      folderId: data.folderId,
      createdBy: data.userId,
    });

    if (data.content) {
      const yDoc = await this.syncService.getOrLoadDocument(document.id);

      try {
        let capturedUpdate: Uint8Array | null = null;
        const observer = (update: Uint8Array) => {
          capturedUpdate = update;
        };
        yDoc.on('update', observer);

        yDoc.transact(() => {
          const yText = yDoc.getText('content');
          yText.insert(0, data.content as string);
        });

        yDoc.off('update', observer);

        if (capturedUpdate) {
          await this.syncService.applyExternalUpdate(
            document.id,
            capturedUpdate,
            data.userId,
          );
        }
      } finally {
        await this.syncService.releaseDocument(document.id);
      }
    }

    return {
      id: document.id,
      title: document.title,
      slug: document.slug,
      folderId: document.folderId,
    };
  }
}
