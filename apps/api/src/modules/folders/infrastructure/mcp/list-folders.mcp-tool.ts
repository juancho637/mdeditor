import { McpTool } from '@common/mcp/infrastructure/mcp-tool.decorator';
import { McpToolDefinition } from '@common/mcp/infrastructure/mcp-tool.definition';
import { ListAccessibleFoldersUseCase } from '@modules/folders/application';

@McpTool()
export class ListFoldersMcpTool extends McpToolDefinition {
  readonly name = 'list_folders';
  readonly description =
    'List all folders the authenticated user has access to';
  readonly schema = {};

  constructor(
    private readonly listAccessibleFolders: ListAccessibleFoldersUseCase,
  ) {
    super();
  }

  async execute(_args: Record<string, never>, userId: string): Promise<object> {
    return this.listAccessibleFolders.run(userId);
  }
}
