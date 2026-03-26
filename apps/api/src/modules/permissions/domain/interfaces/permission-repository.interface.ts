import { FolderPermissionType } from '../types/folder-permission.type';
import { PermissionLevel } from '../enums/permission-level.enum';

export interface PermissionRepositoryInterface {
  findByFolderAndGroup(folderId: string, groupId: string): Promise<FolderPermissionType | null>;
  findAll(): Promise<FolderPermissionType[]>;
  findByFolderId(folderId: string): Promise<FolderPermissionType[]>;
  findById(id: string): Promise<FolderPermissionType | null>;
  upsert(folderId: string, groupId: string, permissionLevel: PermissionLevel): Promise<FolderPermissionType>;
  delete(id: string): Promise<void>;
  deleteByFolderAndGroup(folderId: string, groupId: string): Promise<void>;
}
