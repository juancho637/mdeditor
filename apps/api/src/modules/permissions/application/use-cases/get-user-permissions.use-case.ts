import { GroupRepositoryInterface } from '@modules/groups/domain';
import { UserRepositoryInterface } from '@modules/users/domain';
import { FolderRepositoryInterface } from '@modules/folders/domain';
import { PermissionRepositoryInterface, PermissionLevel } from '../../domain';

export class GetUserPermissionsUseCase {
  constructor(
    private readonly permissionRepository: PermissionRepositoryInterface,
    private readonly groupRepository: GroupRepositoryInterface,
    private readonly userRepository: UserRepositoryInterface,
    private readonly folderRepository: FolderRepositoryInterface,
  ) {}

  async run(userId: string): Promise<Record<string, PermissionLevel>> {
    const user = await this.userRepository.findById(userId);

    // Admin gets EDIT on all folders
    if (user?.isAdmin) {
      const folders = await this.folderRepository.findAll();
      const result: Record<string, PermissionLevel> = {};
      for (const folder of folders) {
        result[folder.id] = PermissionLevel.EDIT;
      }
      return result;
    }

    // Get user's groups
    const groupIds = await this.groupRepository.findGroupIdsByUserId(userId);
    if (groupIds.length === 0) return {};

    // Get all permissions and filter by user's groups
    const allPermissions = await this.permissionRepository.findAll();
    const userPermissions = allPermissions.filter((p) => groupIds.includes(p.groupId));

    // Merge: highest permission per folder
    const result: Record<string, PermissionLevel> = {};
    for (const perm of userPermissions) {
      const current = result[perm.folderId];
      if (!current || (current === PermissionLevel.VIEW && perm.permissionLevel === PermissionLevel.EDIT)) {
        result[perm.folderId] = perm.permissionLevel;
      }
    }

    return result;
  }
}
