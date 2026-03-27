import { DocumentRepositoryInterface, documentErrorsCodes } from '@modules/documents/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { permissionErrorsCodes } from '@modules/permissions/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { HistoryRepositoryInterface, SnapshotSummaryType } from '../../domain';

export class ListDocumentSnapshotsUseCase {
  private readonly context = ListDocumentSnapshotsUseCase.name;

  constructor(
    private readonly historyRepository: HistoryRepositoryInterface,
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(
    documentId: string,
    page: number,
    limit: number,
    authUser: AuthenticatedUserType,
  ): Promise<{ snapshots: SnapshotSummaryType[]; total: number; page: number; limit: number }> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC001,
        context: this.context,
      });
    }

    const permission = await this.checkPermission.run(authUser.id, document.folderId);
    if (!permission) {
      throw this.exception.forbiddenException({
        message: permissionErrorsCodes.PRM002,
        context: this.context,
      });
    }

    const result = await this.historyRepository.findSnapshotsByDocumentId(documentId, page, limit);

    return {
      snapshots: result.snapshots,
      total: result.total,
      page,
      limit,
    };
  }
}
