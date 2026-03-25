export const groupErrorsCodes = {
  GRP001: {
    codeError: 'GRP001',
    message: 'Group not found.',
    serverMessage: 'No group matched the provided filter criteria',
  },
  GRP002: {
    codeError: 'GRP002',
    message: 'A group with this name already exists.',
    serverMessage: 'Attempted to create/update group with duplicate name',
  },
  GRP003: {
    codeError: 'GRP003',
    message: 'User is already a member of this group.',
    serverMessage: 'Attempted to add user to group where they are already a member',
  },
  GRP004: {
    codeError: 'GRP004',
    message: 'User is not a member of this group.',
    serverMessage: 'Attempted to remove user from group where they are not a member',
  },
  GRP005: {
    codeError: 'GRP005',
    message: 'User not found.',
    serverMessage: 'Referenced user does not exist',
  },
  GRP100: {
    codeError: 'GRP100',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to query group from database',
  },
  GRP101: {
    codeError: 'GRP101',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to store group in database',
  },
};
