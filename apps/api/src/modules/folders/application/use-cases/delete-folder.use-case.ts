import { FolderRepositoryInterface, folderErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

export class DeleteFolderUseCase {
  private readonly context = DeleteFolderUseCase.name;

  constructor(
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(id: string): Promise<void> {
    const folder = await this.folderRepository.findById(id);
    if (!folder) {
      throw this.exception.notFoundException({
        message: folderErrorsCodes.FLD001,
        context: this.context,
      });
    }

    await this.folderRepository.delete(id);
  }
}
