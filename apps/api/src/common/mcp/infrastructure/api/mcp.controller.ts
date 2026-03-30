import {
  Controller,
  Post,
  Get,
  Delete,
  Req,
  Res,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';

import { McpServerService } from '../services/mcp-server.service';
import { McpCommonProvidersEnum } from '../mcp-common-providers.enum';

@Controller()
export class McpController {
  private sessions = new Map<string, StreamableHTTPServerTransport>();

  constructor(
    @Inject(McpCommonProvidersEnum.MCP_SERVER_SERVICE)
    private readonly mcpServerService: McpServerService,
  ) {}

  @Post('api/mcp')
  async handlePost(@Req() req: Request, @Res() res: Response): Promise<void> {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId) {
      const transport = this.sessions.get(sessionId);
      if (transport) {
        await transport.handleRequest(req, res, req.body);
        return;
      }
    }

    const newSessionId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId,
      onsessioninitialized: () => {},
    });

    transport.onclose = () => {
      this.sessions.delete(newSessionId);
      this.mcpServerService.removeSession(newSessionId);
    };

    this.sessions.set(newSessionId, transport);
    this.mcpServerService.setSessionUser(newSessionId, userId);

    try {
      const server = this.mcpServerService.createServerForUser(userId);
      await server.server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      this.sessions.delete(newSessionId);
      this.mcpServerService.removeSession(newSessionId);
      if (!res.headersSent) {
        res.status(500).json({ error: 'MCP server error' });
      }
    }
  }

  @Get('api/mcp')
  async handleGet(@Req() req: Request, @Res() res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const transport = sessionId ? this.sessions.get(sessionId) : undefined;

    if (!transport) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }

    await transport.handleRequest(req, res);
  }

  @Delete('api/mcp')
  async handleDelete(@Req() req: Request, @Res() res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const transport = sessionId ? this.sessions.get(sessionId) : undefined;

    if (!transport) {
      res.status(400).json({ error: 'Invalid or missing session ID' });
      return;
    }

    await transport.handleRequest(req, res);
    this.sessions.delete(sessionId!);
    this.mcpServerService.removeSession(sessionId!);
  }
}
