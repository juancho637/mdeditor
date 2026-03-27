export const historyErrorsCodes = {
  HST001: {
    codeError: 'HST001',
    message: 'Snapshot not found.',
    serverMessage: 'Snapshot not found',
  },
  HST002: {
    codeError: 'HST002',
    message: 'No history available for this document.',
    serverMessage: 'No snapshots found for document',
  },
  HST003: {
    codeError: 'HST003',
    message: 'Cannot restore snapshot.',
    serverMessage: 'Failed to restore snapshot to document',
  },
  HST100: {
    codeError: 'HST100',
    message: 'Failed to retrieve document history.',
    serverMessage: 'Database error querying snapshots',
  },
};
