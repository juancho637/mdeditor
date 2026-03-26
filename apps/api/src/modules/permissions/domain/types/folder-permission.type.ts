import { PermissionLevel } from '../enums/permission-level.enum';

export type FolderPermissionType = {
  id: string;
  folderId: string;
  groupId: string;
  permissionLevel: PermissionLevel;
  createdAt: Date;
  updatedAt: Date;
};
