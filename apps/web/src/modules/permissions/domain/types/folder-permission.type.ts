export interface FolderPermission {
  id: string;
  folderId: string;
  groupId: string;
  permissionLevel: 'view' | 'edit';
}
