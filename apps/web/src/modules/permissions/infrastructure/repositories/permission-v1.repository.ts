import { apiClient } from '@/common/adapters/api-client';
import type { PermissionRepository } from '../../domain/repositories/permission-repository';
import type { FolderPermission } from '../../domain/types/folder-permission.type';

interface PermissionWireResponse {
  id: string;
  folder_id: string;
  group_id: string;
  permission_level: string;
}

function mapPermission(wire: PermissionWireResponse): FolderPermission {
  return {
    id: wire.id,
    folderId: wire.folder_id,
    groupId: wire.group_id,
    permissionLevel: wire.permission_level as 'view' | 'edit',
  };
}

export class PermissionV1Repository implements PermissionRepository {
  async getAll(): Promise<FolderPermission[]> {
    const response = await apiClient.get<PermissionWireResponse[]>('/api/permissions');
    return (response.data as PermissionWireResponse[]).map(mapPermission);
  }

  async setPermission(folderId: string, groupId: string, permissionLevel: 'view' | 'edit' | null): Promise<void> {
    await apiClient.put('/api/permissions', {
      folder_id: folderId,
      group_id: groupId,
      permission_level: permissionLevel,
    });
  }
}

export const permissionRepository = new PermissionV1Repository();
