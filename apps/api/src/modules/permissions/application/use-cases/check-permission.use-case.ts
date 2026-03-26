import { GroupRepositoryInterface } from '@modules/groups/domain';
import { UserRepositoryInterface } from '@modules/users/domain';
import { PermissionRepositoryInterface, PermissionLevel } from '../../domain';

export class CheckPermissionUseCase {
  constructor(
    private readonly permissionRepository: PermissionRepositoryInterface,
    private readonly groupRepository: GroupRepositoryInterface,
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async run(userId: string, folderId: string): Promise<PermissionLevel | null> {
    // Admin bypass
    const user = await this.userRepository.findById(userId);
    if (user?.isAdmin) return PermissionLevel.EDIT;

    // Get user's groups
    const groupIds = await this.groupRepository.findGroupIdsByUserId(userId);
    if (groupIds.length === 0) return null;

    // Get permissions for this folder from user's groups
    const folderPermissions = await this.permissionRepository.findByFolderId(folderId);
    const userPermissions = folderPermissions.filter((p) => groupIds.includes(p.groupId));

    if (userPermissions.length === 0) return null;

    // Resolve highest: EDIT > VIEW
    if (userPermissions.some((p) => p.permissionLevel === PermissionLevel.EDIT)) {
      return PermissionLevel.EDIT;
    }
    return PermissionLevel.VIEW;
  }
}
