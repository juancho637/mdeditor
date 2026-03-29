import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';
import { DocumentRepositoryInterface } from '@modules/documents/domain/interfaces/document-repository.interface';
import { CheckPermissionUseCase } from '@modules/permissions/application/use-cases/check-permission.use-case';

import { mcpErrorsCodes } from '../../domain';

export class ReadDocumentUseCase {
  private readonly context = ReadDocumentUseCase.name;

  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(
    userId: string,
    documentId: string,
  ): Promise<{
    id: string;
    title: string;
    slug: string;
    contentMarkdown: string;
    folderId: string;
    updatedAt: Date;
  }> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw this.exception.notFoundException({
        message: mcpErrorsCodes.MCP004,
        context: this.context,
      });
    }

    const permission = await this.checkPermission.run(userId, document.folderId);
    if (permission === null) {
      throw this.exception.forbiddenException({
        message: {
          ...mcpErrorsCodes.MCP002,
          serverMessage: `User ${userId} lacks permission on folder ${document.folderId}`,
        },
        context: this.context,
      });
    }

    return {
      id: document.id,
      title: document.title,
      slug: document.slug,
      contentMarkdown: document.contentMarkdown,
      folderId: document.folderId,
      updatedAt: document.updatedAt,
    };
  }
}
