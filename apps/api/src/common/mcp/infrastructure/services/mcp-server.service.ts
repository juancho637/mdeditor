import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export type McpToolRegistrar = (server: McpServer, userId: string) => void;

export class McpServerService {
  private sessionUserMap = new Map<string, string>();
  private toolRegistrars: McpToolRegistrar[] = [];

  registerTools(registrar: McpToolRegistrar): void {
    this.toolRegistrars.push(registrar);
  }

  setSessionUser(sessionId: string, userId: string): void {
    this.sessionUserMap.set(sessionId, userId);
  }

  removeSession(sessionId: string): void {
    this.sessionUserMap.delete(sessionId);
  }

  createServerForUser(userId: string): McpServer {
    const server = new McpServer({
      name: 'markdown-mcp',
      version: '1.0.0',
    });

    for (const registrar of this.toolRegistrars) {
      registrar(server, userId);
    }

    return server;
  }
}
