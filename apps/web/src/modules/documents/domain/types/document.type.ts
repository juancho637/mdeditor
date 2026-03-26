import { PermissionLevel } from '@/modules/permissions/domain/types/permission-level.enum';

export interface Document {
  id: string;
  folderId: string;
  title: string;
  slug: string;
  contentMarkdown: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  permissionLevel?: PermissionLevel;
}
