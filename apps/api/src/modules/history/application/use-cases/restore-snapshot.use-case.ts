import * as Y from 'yjs';
import {
  DocumentRepositoryInterface,
  documentErrorsCodes,
} from '@modules/documents/domain';
import { CheckPermissionUseCase } from '@modules/permissions/application';
import {
  PermissionLevel,
  permissionErrorsCodes,
} from '@modules/permissions/domain';
import { DocumentSyncServiceInterface } from '@modules/documents/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';
import { AuthenticatedUserType } from '@common/helpers/domain/types/authenticated-user.type';
import {
  HistoryRepositoryInterface,
  RestoreSnapshotResultType,
  historyErrorsCodes,
} from '../../domain';

export class RestoreSnapshotUseCase {
  private readonly context = RestoreSnapshotUseCase.name;

  constructor(
    private readonly historyRepository: HistoryRepositoryInterface,
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly checkPermission: CheckPermissionUseCase,
    private readonly syncService: DocumentSyncServiceInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(
    documentId: string,
    snapshotId: string,
    authUser: AuthenticatedUserType,
  ): Promise<RestoreSnapshotResultType> {
    const snapshot = await this.historyRepository.findSnapshotById(snapshotId);
    if (!snapshot || snapshot.documentId !== documentId) {
      throw this.exception.notFoundException({
        message: historyErrorsCodes.HST001,
        context: this.context,
      });
    }

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw this.exception.notFoundException({
        message: documentErrorsCodes.DOC001,
        context: this.context,
      });
    }

    const permission = await this.checkPermission.run(
      authUser.id,
      document.folderId,
    );
    if (!permission || permission === PermissionLevel.VIEW) {
      throw this.exception.forbiddenException({
        message: permissionErrorsCodes.PRM002,
        context: this.context,
      });
    }

    // Create new Yjs state from the restored markdown content
    const newDoc = new Y.Doc();
    newDoc.getText('content').insert(0, snapshot.contentMarkdown);
    const newYjsState = Buffer.from(Y.encodeStateAsUpdate(newDoc));
    newDoc.destroy();

    // Update document with restored content
    await this.documentRepository.update(documentId, {
      contentMarkdown: snapshot.contentMarkdown,
      yjsState: newYjsState,
    });

    // Create new snapshot entry for the restoration
    const newSnapshotId = await this.historyRepository.saveSnapshot(
      documentId,
      newYjsState,
      snapshot.contentMarkdown,
      authUser.id,
    );

    // Force all connected clients to reload the document
    this.syncService.forceDocumentReload(documentId);

    return {
      documentId,
      restoredFromSnapshotId: snapshotId,
      newSnapshotId,
      contentMarkdown: snapshot.contentMarkdown,
    };
  }
}
