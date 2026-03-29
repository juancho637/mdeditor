import { FolderRepositoryInterface } from '@modules/folders/domain/interfaces/folder-repository.interface';
import { CheckPermissionUseCase } from '@modules/permissions/application/use-cases/check-permission.use-case';

export class ListFoldersUseCase {
  constructor(
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
  ) {}

  async run(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
    }>
  > {
    const allFolders = await this.folderRepository.findAll();

    const accessibleFolders: Array<{
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
    }> = [];

    for (const folder of allFolders) {
      const permission = await this.checkPermission.run(userId, folder.id);
      if (permission !== null) {
        accessibleFolders.push({
          id: folder.id,
          name: folder.name,
          slug: folder.slug,
          parentId: folder.parentId,
        });
      }
    }

    return accessibleFolders;
  }
}
