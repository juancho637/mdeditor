import { PermissionRepositoryInterface, FolderPermissionType } from '../../domain';

export class GetPermissionMatrixUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryInterface) {}

  async run(): Promise<FolderPermissionType[]> {
    return this.permissionRepository.findAll();
  }
}
