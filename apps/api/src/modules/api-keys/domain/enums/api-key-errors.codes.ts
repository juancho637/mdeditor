export const apiKeyErrorsCodes = {
  AKY001: {
    codeError: 'AKY001',
    message: 'Invalid or revoked API key.',
    serverMessage: 'API key not found or inactive',
  },
  AKY005: {
    codeError: 'AKY005',
    message: 'Has alcanzado el máximo de 3 API keys activas.',
    serverMessage: 'Max active API keys limit reached',
  },
  AKY006: {
    codeError: 'AKY006',
    message: 'API key no encontrada.',
    serverMessage: 'API key not found or does not belong to user',
  },
};
