export const documentErrorsCodes = {
  DOC001: {
    codeError: 'DOC001',
    message: 'Document not found.',
    serverMessage: 'No document matched the provided filter criteria',
  },
  DOC003: {
    codeError: 'DOC003',
    message: 'Document is already in this folder.',
    serverMessage: 'Attempted to move document to its current folder',
  },
  DOC100: {
    codeError: 'DOC100',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to query document from database',
  },
  DOC101: {
    codeError: 'DOC101',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to store document in database',
  },
};
