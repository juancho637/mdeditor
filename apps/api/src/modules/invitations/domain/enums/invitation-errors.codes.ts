export const invitationErrorsCodes = {
  INV001: {
    codeError: 'INV001',
    message: 'Invitation not found.',
    serverMessage: 'No invitation matched the provided token',
  },
  INV002: {
    codeError: 'INV002',
    message: 'This invitation has already been used.',
    serverMessage: 'Attempted to accept an already accepted invitation',
  },
  INV003: {
    codeError: 'INV003',
    message: 'A user with this email already has an account.',
    serverMessage: 'Attempted to invite an email that already has an active user account',
  },
  INV004: {
    codeError: 'INV004',
    message: 'A pending invitation already exists for this email.',
    serverMessage: 'Attempted to create a duplicate pending invitation',
  },
  INV100: {
    codeError: 'INV100',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to query invitation from database',
  },
  INV101: {
    codeError: 'INV101',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to store invitation in database',
  },
};
