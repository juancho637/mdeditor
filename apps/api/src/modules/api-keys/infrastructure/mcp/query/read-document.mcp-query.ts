import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { ExceptionServiceInterface } from '@common/exception/domain/exception-service.interface';
import { DocumentRepositoryInterface } from '@modules/documents/domain/interfaces/document-repository.interface';
import { CheckPermissionUseCase } from '@modules/permissions/application/use-cases/check-permission.use-case';

import { apiKeyErrorsCodes } from '../../../domain';

export class ReadDocumentMcpQuery {
  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  register(server: McpServer, userId: string): void {
    server.tool(
      'read_document',
      'Read the full markdown content of a document',
      { document_id: z.string().uuid().describe('The UUID of the document to read') },
      async (args) => {
        try {
          const document = await this.documentRepository.findById(args.document_id);
          if (!document) {
            throw this.exception.notFoundException({
              message: apiKeyErrorsCodes.AKY004,
              context: ReadDocumentMcpQuery.name,
            });
          }

          const permission = await this.checkPermission.run(userId, document.folderId);
          if (permission === null) {
            throw this.exception.forbiddenException({
              message: {
                ...apiKeyErrorsCodes.AKY002,
                serverMessage: `User ${userId} lacks permission on folder ${document.folderId}`,
              },
              context: ReadDocumentMcpQuery.name,
            });
          }

          return { content: [{ type: 'text' as const, text: document.contentMarkdown }] };
        } catch (error: any) {
          return { content: [{ type: 'text' as const, text: this.formatError(error) }], isError: true };
        }
      },
    );
  }

  private formatError(error: any): string {
    return error?.response?.code_error
      ? `${error.response.code_error}: ${error.response.message}`
      : 'Operation failed.';
  }
}
