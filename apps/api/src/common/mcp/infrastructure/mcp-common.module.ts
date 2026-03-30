import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { ApiKeysModule } from '@modules/api-keys/infrastructure';
import { ApiKeyAuthGuard } from '@common/helpers/infrastructure';

import { McpServerService } from './services/mcp-server.service';
import { McpToolExplorerService } from './services/mcp-tool-explorer.service';
import { McpController } from './api/mcp.controller';
import { McpCommonProvidersEnum } from '../domain/mcp-common-providers.enum';

@Module({
  imports: [DiscoveryModule, ApiKeysModule],
  controllers: [McpController],
  providers: [
    {
      provide: McpCommonProvidersEnum.MCP_SERVER_SERVICE,
      useFactory: () => new McpServerService(),
    },
    McpToolExplorerService,
    ApiKeyAuthGuard,
  ],
  exports: [McpCommonProvidersEnum.MCP_SERVER_SERVICE],
})
export class McpCommonModule {}
