import { DocumentRepositoryInterface, documentErrorsCodes } from '@modules/documents/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import { ExceptionServiceInterface } from '@common/exception/domain';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import { HistoryRepositoryInterface, SnapshotDetailType, historyErrorsCodes } from '../../domain';

export class GetSnapshotDetailUseCase {
  constructor(
    private readonly historyRepository: HistoryRepositoryInterface,
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(documentId: string, snapshotId: string, authUser: AuthenticatedUserType): Promise<SnapshotDetailType> {
    const snapshot = await this.historyRepository.findSnapshotById(snapshotId);
    if (!snapshot || snapshot.documentId !== documentId) {
      throw this.exception.notFoundException({
        message: historyErrorsCodes.HST001,
      });
    }

    const document = await this.documentRepository.findById(snapshot.documentId);
    if (!document) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC001,
      });
    }

    const permission = await this.checkPermission.run(authUser.id, document.folderId);
    if (!permission) {
      throw this.exception.forbiddenException({
        message: { codeError: 'PRM001', message: 'Insufficient permissions.', serverMessage: `User ${authUser.id} has no permission on folder ${document.folderId}` },
      });
    }

    return snapshot;
  }
}
