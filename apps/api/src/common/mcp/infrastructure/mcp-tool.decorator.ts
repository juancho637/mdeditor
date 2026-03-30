import { SetMetadata } from '@nestjs/common';

export const MCP_TOOL_METADATA = 'MCP_TOOL';

export const McpTool = (): ClassDecorator =>
  SetMetadata(MCP_TOOL_METADATA, true);
