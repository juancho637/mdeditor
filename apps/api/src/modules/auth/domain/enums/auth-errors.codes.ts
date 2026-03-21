export const authErrorsCodes = {
  AUT001: {
    codeError: 'AUT001',
    message: 'Invalid credentials.',
    serverMessage: 'Authentication failed: invalid email or password',
  },
  AUT002: {
    codeError: 'AUT002',
    message: 'Unauthorized.',
    serverMessage: 'User is not authenticated or token is invalid',
  },
  AUT003: {
    codeError: 'AUT003',
    message: 'Setup already completed.',
    serverMessage: 'Setup was attempted but users already exist in the system',
  },
};
