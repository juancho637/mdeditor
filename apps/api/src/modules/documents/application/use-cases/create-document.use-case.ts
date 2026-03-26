import { FolderRepositoryInterface, folderErrorsCodes } from '@modules/folders/domain';
import { DocumentRepositoryInterface, DocumentType } from '../../domain';
import { ExceptionServiceInterface } from '@common/exception/domain';

function generateSlug(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export class CreateDocumentUseCase {
  private readonly context = CreateDocumentUseCase.name;

  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly folderRepository: FolderRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(data: { title: string; folderId: string; createdBy: string }): Promise<DocumentType> {
    const folder = await this.folderRepository.findById(data.folderId);
    if (!folder) {
      throw this.exception.notFoundException({
        message: folderErrorsCodes.FLD001,
        context: this.context,
      });
    }

    return this.documentRepository.create({
      title: data.title.trim(),
      slug: generateSlug(data.title),
      folderId: data.folderId,
      createdBy: data.createdBy,
    });
  }
}
