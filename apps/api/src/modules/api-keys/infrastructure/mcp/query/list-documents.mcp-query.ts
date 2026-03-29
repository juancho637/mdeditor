import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';
import { DocumentRepositoryInterface } from '@modules/documents/domain/interfaces/document-repository.interface';
import { FolderRepositoryInterface } from '@modules/folders/domain/interfaces/folder-repository.interface';
import { CheckPermissionUseCase } from '@modules/permissions/application/use-cases/check-permission.use-case';

import { apiKeyErrorsCodes } from '../../../domain';

export class ListDocumentsMcpQuery {
  constructor(
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  register(server: McpServer, userId: string): void {
    server.tool(
      'list_documents',
      'List all documents in a folder',
      {
        folder_id: z
          .string()
          .uuid()
          .describe('The UUID of the folder to list documents from'),
      },
      async (args) => {
        try {
          const folder = await this.folderRepository.findById(args.folder_id);
          if (!folder) {
            throw this.exception.notFoundException({
              message: apiKeyErrorsCodes.AKY003,
              context: ListDocumentsMcpQuery.name,
            });
          }

          const permission = await this.checkPermission.run(
            userId,
            args.folder_id,
          );
          if (permission === null) {
            throw this.exception.forbiddenException({
              message: {
                ...apiKeyErrorsCodes.AKY002,
                serverMessage: `User ${userId} lacks permission on folder ${args.folder_id}`,
              },
              context: ListDocumentsMcpQuery.name,
            });
          }

          const documents = await this.documentRepository.findByFolderId(
            args.folder_id,
          );
          const result = documents.map((doc) => ({
            id: doc.id,
            title: doc.title,
            slug: doc.slug,
            updatedAt: doc.updatedAt,
          }));

          return {
            content: [
              { type: 'text' as const, text: JSON.stringify(result, null, 2) },
            ],
          };
        } catch (error: unknown) {
          return {
            content: [{ type: 'text' as const, text: this.formatError(error) }],
            isError: true,
          };
        }
      },
    );
  }

  private formatError(error: unknown): string {
    const err = error as {
      response?: { code_error?: string; message?: string };
    };
    return err?.response?.code_error
      ? `${err.response.code_error}: ${err.response.message}`
      : 'Operation failed.';
  }
}
