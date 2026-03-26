import { FolderRepositoryInterface, folderErrorsCodes } from '@modules/folders/domain';
import { GroupRepositoryInterface, groupErrorsCodes } from '@modules/groups/domain';
import {
  PermissionRepositoryInterface,
  FolderPermissionType,
  PermissionLevel,
} from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class SetPermissionUseCase {
  private readonly context = SetPermissionUseCase.name;

  constructor(
    private readonly permissionRepository: PermissionRepositoryInterface,
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly groupRepository: GroupRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: {
    folderId: string;
    groupId: string;
    permissionLevel: PermissionLevel | null;
  }): Promise<FolderPermissionType | null> {
    const folder = await this.folderRepository.findById(data.folderId);
    if (!folder) {
      throw this.exception.notFoundException({
        message: folderErrorsCodes.FLD001,
        context: this.context,
      });
    }

    const group = await this.groupRepository.findById(data.groupId);
    if (!group) {
      throw this.exception.notFoundException({
        message: groupErrorsCodes.GRP001,
        context: this.context,
      });
    }

    if (data.permissionLevel === null) {
      await this.permissionRepository.deleteByFolderAndGroup(data.folderId, data.groupId);
      return null;
    }

    return this.permissionRepository.upsert(data.folderId, data.groupId, data.permissionLevel);
  }
}
