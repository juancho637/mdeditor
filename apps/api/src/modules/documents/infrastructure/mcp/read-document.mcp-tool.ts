import { McpTool } from '@common/mcp/infrastructure/mcp-tool.decorator';
import {
  McpToolDefinition,
  mcpSchema,
} from '@common/mcp/infrastructure/mcp-tool.definition';
import { ReadDocumentContentUseCase } from '../../application';

const schema = {
  document_id: mcpSchema
    .string()
    .uuid()
    .describe('The UUID of the document to read'),
};

@McpTool()
export class ReadDocumentMcpTool extends McpToolDefinition {
  readonly name = 'read_document';
  readonly description = 'Read the full markdown content of a document';
  readonly schema = schema;

  constructor(
    private readonly readDocumentContent: ReadDocumentContentUseCase,
  ) {
    super();
  }

  async execute(
    args: { document_id: string },
    userId: string,
  ): Promise<string> {
    return this.readDocumentContent.run(userId, args.document_id);
  }
}
