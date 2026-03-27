export const permissionErrorsCodes = {
  PRM001: {
    codeError: 'PRM001',
    message: 'Permission not found.',
    serverMessage: 'No permission matched the provided filter criteria',
  },
  PRM002: {
    codeError: 'PRM002',
    message: 'Insufficient permissions.',
    serverMessage: 'User does not have the required permission on this resource',
  },
  PRM100: {
    codeError: 'PRM100',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to query permission from database',
  },
  PRM101: {
    codeError: 'PRM101',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to store permission in database',
  },
};
