import { McpTool } from '@common/mcp/infrastructure/mcp-tool.decorator';
import {
  McpToolDefinition,
  mcpSchema,
} from '@common/mcp/infrastructure/mcp-tool.definition';
import { ReplaceDocumentContentUseCase } from '../../application';

const schema = {
  document_id: mcpSchema
    .string()
    .uuid()
    .describe('The UUID of the document to edit'),
  content: mcpSchema
    .string()
    .describe('The new markdown content for the document'),
};

@McpTool()
export class EditDocumentMcpTool extends McpToolDefinition {
  readonly name = 'edit_document';
  readonly description =
    'Replace the content of an existing document with new markdown content';
  readonly schema = schema;

  constructor(
    private readonly replaceDocumentContent: ReplaceDocumentContentUseCase,
  ) {
    super();
  }

  async execute(
    args: { document_id: string; content: string },
    userId: string,
  ): Promise<object> {
    return this.replaceDocumentContent.run(
      userId,
      args.document_id,
      args.content,
    );
  }
}
