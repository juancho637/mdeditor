export const folderErrorsCodes = {
  FLD001: {
    codeError: 'FLD001',
    message: 'Folder not found.',
    serverMessage: 'No folder matched the provided filter criteria',
  },
  FLD002: {
    codeError: 'FLD002',
    message: 'A folder with this name already exists in this location.',
    serverMessage: 'Attempted to create/rename folder with duplicate name in same parent',
  },
  FLD100: {
    codeError: 'FLD100',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to query folder from database',
  },
  FLD101: {
    codeError: 'FLD101',
    message: 'Could not process the request at this time.',
    serverMessage: 'Failed to store folder in database',
  },
};
