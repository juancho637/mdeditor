import { FolderRepositoryInterface, FolderType } from '../../domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';

export class ListAccessibleFoldersUseCase {
  constructor(
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  async run(
    userId: string,
  ): Promise<Pick<FolderType, 'id' | 'name' | 'slug' | 'parentId'>[]> {
    const allFolders = await this.folderRepository.findAll();
    const accessible: Pick<FolderType, 'id' | 'name' | 'slug' | 'parentId'>[] =
      [];

    for (const folder of allFolders) {
      const permission = await this.checkPermission.run(userId, folder.id);
      if (permission !== null) {
        accessible.push({
          id: folder.id,
          name: folder.name,
          slug: folder.slug,
          parentId: folder.parentId,
        });
      }
    }

    return accessible;
  }
}
