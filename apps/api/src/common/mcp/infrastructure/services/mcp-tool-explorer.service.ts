import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { McpToolDefinition } from '../mcp-tool.definition';
import { McpCommonProvidersEnum } from '../../domain/mcp-common-providers.enum';
import { McpServerService } from './mcp-server.service';

@Injectable()
export class McpToolExplorerService implements OnModuleInit {
  private readonly logger = new Logger(McpToolExplorerService.name);

  constructor(
    private readonly discovery: DiscoveryService,
    @Inject(McpCommonProvidersEnum.MCP_SERVER_SERVICE)
    private readonly mcpServerService: McpServerService,
  ) {}

  onModuleInit(): void {
    const providers = this.discovery.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance) continue;

      if (instance instanceof McpToolDefinition) {
        this.mcpServerService.registerTools((server, userId) =>
          instance.register(server, userId),
        );
        this.logger.log(`Registered MCP tool: ${instance.name}`);
      }
    }
  }
}
