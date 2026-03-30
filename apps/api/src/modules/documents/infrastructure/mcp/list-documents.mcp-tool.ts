import { McpTool } from '@common/mcp/infrastructure/mcp-tool.decorator';
import {
  McpToolDefinition,
  mcpSchema,
} from '@common/mcp/infrastructure/mcp-tool.definition';
import { ListAccessibleDocumentsUseCase } from '../../application';

const schema = {
  folder_id: mcpSchema
    .string()
    .uuid()
    .describe('The UUID of the folder to list documents from'),
};

@McpTool()
export class ListDocumentsMcpTool extends McpToolDefinition {
  readonly name = 'list_documents';
  readonly description = 'List all documents in a folder';
  readonly schema = schema;

  constructor(
    private readonly listAccessibleDocuments: ListAccessibleDocumentsUseCase,
  ) {
    super();
  }

  async execute(args: { folder_id: string }, userId: string): Promise<object> {
    return this.listAccessibleDocuments.run(userId, args.folder_id);
  }
}
