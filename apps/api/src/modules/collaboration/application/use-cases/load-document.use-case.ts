import * as Y from 'yjs';
import { DocumentRepositoryInterface } from '@modules/documents/domain';
import { ExceptionServiceInterface } from '@common/exception/domain';
import { DocumentSnapshotRepositoryInterface, DocumentUpdateRepositoryInterface, collaborationErrorsCodes } from '../../domain';

export class LoadDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly snapshotRepository: DocumentSnapshotRepositoryInterface,
    private readonly updateRepository: DocumentUpdateRepositoryInterface,
    private readonly exception: ExceptionServiceInterface,
  ) {}

  async run(documentId: string): Promise<Y.Doc> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw this.exception.notFoundException({
        message: collaborationErrorsCodes.COL001,
        context: LoadDocumentUseCase.name,
      });
    }

    const yDoc = new Y.Doc();

    if (document.yjsState) {
      Y.applyUpdate(yDoc, new Uint8Array(document.yjsState));
    } else {
      // Document has no Yjs state yet — check for snapshot
      const snapshot = await this.snapshotRepository.getLatestSnapshot(documentId);
      if (snapshot) {
        Y.applyUpdate(yDoc, new Uint8Array(snapshot.yjsSnapshot));
        // Apply incremental updates since snapshot
        const updates = await this.updateRepository.getUpdatesSince(documentId, snapshot.createdAt);
        for (const update of updates) {
          Y.applyUpdate(yDoc, update);
        }
      } else {
        // First time — initialize Y.Doc with existing markdown content
        const yText = yDoc.getText('content');
        if (document.contentMarkdown) {
          yText.insert(0, document.contentMarkdown);
        }
      }
    }

    return yDoc;
  }
}
