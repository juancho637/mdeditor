import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { ListFoldersUseCase, ListDocumentsUseCase, ReadDocumentUseCase } from '../../application';

export class McpServerService {
  private sessionUserMap = new Map<string, string>();

  constructor(
    private readonly listFoldersUseCase: ListFoldersUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly readDocumentUseCase: ReadDocumentUseCase,
  ) {}

  onModuleInit(): void {
    // Initialization hook — called by factory
  }

  setSessionUser(sessionId: string, userId: string): void {
    this.sessionUserMap.set(sessionId, userId);
  }

  removeSession(sessionId: string): void {
    this.sessionUserMap.delete(sessionId);
  }

  createServer(): McpServer {
    const server = new McpServer({
      name: 'markdown-mcp',
      version: '1.0.0',
    });

    this.registerTools(server);
    return server;
  }

  private registerTools(server: McpServer): void {
    server.tool(
      'list_folders',
      'List all folders the authenticated user has access to',
      {},
      async (_args, extra) => {
        const userId = this.getUserIdFromExtra(extra);
        try {
          const folders = await this.listFoldersUseCase.run(userId);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(folders, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text' as const, text: this.formatErrorMessage(error) }],
            isError: true,
          };
        }
      },
    );

    server.tool(
      'list_documents',
      'List all documents in a folder',
      { folder_id: z.string().uuid().describe('The UUID of the folder to list documents from') },
      async (args, extra) => {
        const userId = this.getUserIdFromExtra(extra);
        try {
          const documents = await this.listDocumentsUseCase.run(userId, args.folder_id);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(documents, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text' as const, text: this.formatErrorMessage(error) }],
            isError: true,
          };
        }
      },
    );

    server.tool(
      'read_document',
      'Read the full markdown content of a document',
      { document_id: z.string().uuid().describe('The UUID of the document to read') },
      async (args, extra) => {
        const userId = this.getUserIdFromExtra(extra);
        try {
          const document = await this.readDocumentUseCase.run(userId, args.document_id);
          return {
            content: [
              {
                type: 'text' as const,
                text: document.contentMarkdown,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text' as const, text: this.formatErrorMessage(error) }],
            isError: true,
          };
        }
      },
    );
  }

  private getUserIdFromExtra(extra: any): string {
    const sessionId = extra?.sessionId as string;
    const userId = this.sessionUserMap.get(sessionId);
    if (!userId) {
      throw new Error('Session not authenticated');
    }
    return userId;
  }

  private formatErrorMessage(error: any): string {
    const response = error?.response;
    if (response?.code_error) {
      return `${response.code_error}: ${response.message}`;
    }
    if (error?.message?.includes('Permission denied')) {
      return 'Permission denied.';
    }
    if (error?.message?.includes('not found')) {
      return 'Resource not found.';
    }
    return 'Operation failed.';
  }
}
