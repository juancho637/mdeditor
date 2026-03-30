import { Module } from '@nestjs/common';

import { McpServerService } from './services/mcp-server.service';
import { McpController } from './api/mcp.controller';
import { McpCommonProvidersEnum } from './mcp-common-providers.enum';

@Module({
  controllers: [McpController],
  providers: [
    {
      provide: McpCommonProvidersEnum.MCP_SERVER_SERVICE,
      useFactory: () => new McpServerService(),
    },
  ],
  exports: [McpCommonProvidersEnum.MCP_SERVER_SERVICE],
})
export class McpCommonModule {}
