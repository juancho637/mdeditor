import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { FolderRepositoryInterface } from '@modules/folders/domain/interfaces/folder-repository.interface';
import { CheckPermissionUseCase } from '@modules/permissions/application/use-cases/check-permission.use-case';

export class ListFoldersMcpQuery {
  constructor(
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  register(server: McpServer, userId: string): void {
    server.tool(
      'list_folders',
      'List all folders the authenticated user has access to',
      {},
      async () => {
        try {
          const allFolders = await this.folderRepository.findAll();
          const accessible: Array<{ id: string; name: string; slug: string; parentId: string | null }> = [];

          for (const folder of allFolders) {
            const permission = await this.checkPermission.run(userId, folder.id);
            if (permission !== null) {
              accessible.push({ id: folder.id, name: folder.name, slug: folder.slug, parentId: folder.parentId });
            }
          }

          return { content: [{ type: 'text' as const, text: JSON.stringify(accessible, null, 2) }] };
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
