import { Controller, Post, Get, Delete, Req, Res, UseGuards, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';

import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';

import { McpProvidersEnum } from '../../domain';
import { McpServerService } from '../services/mcp-server.service';
import { ApiKeyAuthGuard } from '../guards/api-key-auth.guard';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUserType;
}

@Controller()
export class McpController {
  private sessions = new Map<string, StreamableHTTPServerTransport>();

  constructor(
    @Inject(McpProvidersEnum.MCP_SERVER_SERVICE)
    private readonly mcpServerService: McpServerService,
  ) {}

  @Post('api/mcp')
  @UseGuards(ApiKeyAuthGuard)
  async handlePost(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const userId = req.user.id;
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
      onsessioninitialized: () => {
        // Session data already set synchronously below
      },
    });

    transport.onclose = () => {
      this.sessions.delete(newSessionId);
      this.mcpServerService.removeSession(newSessionId);
    };

    // Set session data synchronously before connect to avoid race conditions
    this.sessions.set(newSessionId, transport);
    this.mcpServerService.setSessionUser(newSessionId, userId);

    try {
      const server = this.mcpServerService.createServer();
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
  @UseGuards(ApiKeyAuthGuard)
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
  @UseGuards(ApiKeyAuthGuard)
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
