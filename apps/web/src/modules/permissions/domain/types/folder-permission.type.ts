import { PermissionLevel } from './permission-level.enum';

export interface FolderPermission {
  id: string;
  folderId: string;
  groupId: string;
  permissionLevel: PermissionLevel;
}
