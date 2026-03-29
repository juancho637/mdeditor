import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';
import { DocumentRepositoryInterface } from '@modules/documents/domain/interfaces/document-repository.interface';
import { FolderRepositoryInterface } from '@modules/folders/domain/interfaces/folder-repository.interface';
import { CheckPermissionUseCase } from '@modules/permissions/application/use-cases/check-permission.use-case';

import { mcpErrorsCodes } from '../../domain';

export class ListDocumentsUseCase {
  private readonly context = ListDocumentsUseCase.name;

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
    Array<{
      id: string;
      title: string;
      slug: string;
      updatedAt: Date;
    }>
  > {
    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw this.exception.notFoundException({
        message: mcpErrorsCodes.MCP003,
        context: this.context,
      });
    }

    const permission = await this.checkPermission.run(userId, folderId);
    if (permission === null) {
      throw this.exception.forbiddenException({
        message: {
          ...mcpErrorsCodes.MCP002,
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
