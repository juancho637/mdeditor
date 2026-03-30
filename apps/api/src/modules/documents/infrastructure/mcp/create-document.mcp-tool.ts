import { McpTool } from '@common/mcp/infrastructure/mcp-tool.decorator';
import {
  McpToolDefinition,
  mcpSchema,
} from '@common/mcp/infrastructure/mcp-tool.definition';
import { CreateDocumentWithContentUseCase } from '../../application';

const schema = {
  folder_id: mcpSchema
    .string()
    .uuid()
    .describe('The UUID of the folder to create the document in'),
  title: mcpSchema.string().min(1).describe('The title of the new document'),
  content: mcpSchema
    .string()
    .optional()
    .describe('Optional markdown content for the document'),
};

@McpTool()
export class CreateDocumentMcpTool extends McpToolDefinition {
  readonly name = 'create_document';
  readonly description = 'Create a new document in a folder';
  readonly schema = schema;

  constructor(
    private readonly createDocumentWithContent: CreateDocumentWithContentUseCase,
  ) {
    super();
  }

  async execute(
    args: { folder_id: string; title: string; content?: string },
    userId: string,
  ): Promise<object> {
    const result = await this.createDocumentWithContent.run({
      userId,
      folderId: args.folder_id,
      title: args.title,
      content: args.content,
    });

    return {
      id: result.id,
      title: result.title,
      slug: result.slug,
      folder_id: result.folderId,
    };
  }
}
