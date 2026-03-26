import { FolderRepositoryInterface, FolderType, folderErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export class UpdateFolderUseCase {
  private readonly context = UpdateFolderUseCase.name;

  constructor(
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(id: string, name: string): Promise<FolderType> {
    const folder = await this.folderRepository.findById(id);
    if (!folder) {
      throw this.exception.notFoundException({
        message: folderErrorsCodes.FLD001,
        context: this.context,
      });
    }

    const trimmedName = name.trim();
    const existing = await this.folderRepository.findByNameInParent(trimmedName, folder.parentId);
    if (existing && existing.id !== id) {
      throw this.exception.badRequestException({
        message: folderErrorsCodes.FLD002,
        context: this.context,
      });
    }

    return this.folderRepository.update(id, {
      name: trimmedName,
      slug: generateSlug(trimmedName),
    });
  }
}
