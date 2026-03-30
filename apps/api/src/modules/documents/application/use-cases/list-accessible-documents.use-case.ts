import { ExceptionServiceInterface } from '@common/exception/domain';
import { mcpErrorCodes } from '@common/mcp/domain/mcp-errors.codes';
import { FolderRepositoryInterface } from '@modules/folders/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { DocumentRepositoryInterface, DocumentSummaryType } from '../../domain';

export class ListAccessibleDocumentsUseCase {
  private readonly context = ListAccessibleDocumentsUseCase.name;

  constructor(
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(
    userId: string,
    folderId: string,
  ): Promise<
    Pick<DocumentSummaryType, 'id' | 'title' | 'slug' | 'updatedAt'>[]
  > {
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw this.exception.notFoundException({
        message: mcpErrorCodes.FOLDER_NOT_FOUND,
        context: this.context,
      });
    }

    const permission = await this.checkPermission.run(userId, folderId);
    if (permission === null) {
      throw this.exception.forbiddenException({
        message: {
          ...mcpErrorCodes.PERMISSION_DENIED,
          serverMessage: `User ${userId} lacks permission on folder ${folderId}`,
        },
        context: this.context,
      });
    }

    const documents = await this.documentRepository.findByFolderId(folderId);
    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      updatedAt: doc.updatedAt,
    }));
  }
}
