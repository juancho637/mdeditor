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
  DOC004: {
    codeError: 'DOC004',
    message: 'Documento no encontrado.',
    serverMessage: 'Share token not found or has been revoked',
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
