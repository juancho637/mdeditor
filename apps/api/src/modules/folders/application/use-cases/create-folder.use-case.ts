import { FolderRepositoryInterface, FolderType, folderErrorsCodes } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';
import { generateSlug } from '@common/helpers/infrastructure/utils/slug.utils';

export class CreateFolderUseCase {
  private readonly context = CreateFolderUseCase.name;

  constructor(
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: { name: string; parentId: string | null; createdBy: string }): Promise<FolderType> {
    const trimmedName = data.name.trim();

    if (data.parentId) {
      const parent = await this.folderRepository.findById(data.parentId);
      if (!parent) {
        throw this.exception.notFoundException({
          message: folderErrorsCodes.FLD001,
          context: this.context,
        });
      }
    }

    const existing = await this.folderRepository.findByNameInParent(trimmedName, data.parentId);
    if (existing) {
      throw this.exception.badRequestException({
        message: folderErrorsCodes.FLD002,
        context: this.context,
      });
    }

    return this.folderRepository.create({
      name: trimmedName,
      slug: generateSlug(trimmedName),
      parentId: data.parentId,
      createdBy: data.createdBy,
    });
  }
}
