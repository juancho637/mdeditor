export const usersErrorsCodes = {
  USR001: {
    codeError: 'USR001',
    message: 'User not found.',
    serverMessage: 'No user matched the provided filter criteria',
  },
  USR002: {
    codeError: 'USR002',
    message: 'A user with this email already exists.',
    serverMessage: 'Attempted to create a user with a duplicate email',
  },
  USR100: {
    codeError: 'USR100',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to query user from database',
  },
  USR101: {
    codeError: 'USR101',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to store user in database',
  },
};
