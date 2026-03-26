import type { FolderPermission } from '../types/folder-permission.type';

export interface PermissionRepository {
  getAll(): Promise<FolderPermission[]>;
  setPermission(folderId: string, groupId: string, permissionLevel: 'view' | 'edit' | null): Promise<void>;
}
