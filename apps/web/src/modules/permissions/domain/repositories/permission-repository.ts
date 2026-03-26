import type { FolderPermission } from '../types/folder-permission.type';
import { PermissionLevel } from '../types/permission-level.enum';

export interface PermissionRepository {
  getAll(): Promise<FolderPermission[]>;
  setPermission(folderId: string, groupId: string, permissionLevel: PermissionLevel): Promise<void>;
  deletePermission(id: string): Promise<void>;
}
