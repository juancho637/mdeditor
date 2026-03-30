import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpToolResponseType } from '../domain/types/mcp-tool-response.type';

export { z as mcpSchema } from 'zod';

export abstract class McpToolDefinition {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly schema: Record<string, unknown>;

  abstract execute(
    args: Record<string, unknown>,
    userId: string,
  ): Promise<string | object>;

  register(server: McpServer, userId: string): void {
    server.tool(this.name, this.description, this.schema, async (args) => {
      try {
        const result = await this.execute(args, userId);
        const text =
          typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        return this.success(text);
      } catch (error: unknown) {
        return this.error(error);
      }
    });
  }

  private success(text: string): McpToolResponseType {
    return { content: [{ type: 'text' as const, text }] };
  }

  private error(error: unknown): McpToolResponseType {
    const err = error as {
      response?: { code_error?: string; message?: string };
    };
    const text = err?.response?.code_error
      ? `${err.response.code_error}: ${err.response.message}`
      : 'Operation failed.';
    return { content: [{ type: 'text' as const, text }], isError: true };
  }
}
