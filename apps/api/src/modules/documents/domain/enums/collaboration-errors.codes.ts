export const collaborationErrorsCodes = {
  COL001: {
    codeError: 'COL001',
    message: 'Document is not available for collaboration.',
    serverMessage:
      'Document not found or not available for collaborative editing',
  },
  COL002: {
    codeError: 'COL002',
    message: 'Synchronization failed.',
    serverMessage: 'Failed to synchronize document changes',
  },
  COL100: {
    codeError: 'COL100',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to persist collaboration data to database',
  },
};
