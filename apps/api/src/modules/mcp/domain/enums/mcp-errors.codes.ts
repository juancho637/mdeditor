export const mcpErrorsCodes = {
  MCP001: {
    codeError: 'MCP001',
    message: 'Invalid or revoked API key.',
    serverMessage: 'API key not found or inactive',
  },
  MCP002: {
    codeError: 'MCP002',
    message: 'Permission denied.',
    serverMessage: 'User lacks permission on the requested resource',
  },
  MCP003: {
    codeError: 'MCP003',
    message: 'Folder not found.',
    serverMessage: 'Folder does not exist',
  },
  MCP004: {
    codeError: 'MCP004',
    message: 'Document not found.',
    serverMessage: 'Document does not exist',
  },
};
