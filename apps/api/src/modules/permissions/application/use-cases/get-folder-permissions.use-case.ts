import { PermissionRepositoryInterface, FolderPermissionType } from '../../domain';

export class GetFolderPermissionsUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryInterface) {}

  async run(folderId: string): Promise<FolderPermissionType[]> {
    return this.permissionRepository.findByFolderId(folderId);
  }
}
