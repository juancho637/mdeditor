import { FolderRepositoryInterface, FolderType, folderErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class GetFolderByIdUseCase {
  private readonly context = GetFolderByIdUseCase.name;

  constructor(
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(id: string): Promise<{ folder: FolderType; path: Array<{ id: string; name: string }> }> {
    const folder = await this.folderRepository.findById(id);
    if (!folder) {
      throw this.exception.notFoundException({
        message: folderErrorsCodes.FLD001,
        context: this.context,
      });
    }

    const pathFolders = await this.folderRepository.getPath(id);
    const path = pathFolders.map((f) => ({ id: f.id, name: f.name }));

    return { folder, path };
  }
}
