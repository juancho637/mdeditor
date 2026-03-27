import * as Y from 'yjs';
import { DocumentRepositoryInterface } from '@modules/documents/domain';
import { DocumentSnapshotRepositoryInterface, DocumentUpdateRepositoryInterface } from '../../domain';

export class PersistSnapshotUseCase {
  constructor(
    private readonly documentRepository: DocumentRepositoryInterface,
    private readonly snapshotRepository: DocumentSnapshotRepositoryInterface,
    private readonly updateRepository: DocumentUpdateRepositoryInterface,
  ) {}

  async run(documentId: string, yDoc: Y.Doc): Promise<void> {
    // Capture timestamp BEFORE encoding to safely delete only older updates
    const snapshotTime = new Date();
    const snapshot = Y.encodeStateAsUpdate(yDoc);
    const yText = yDoc.getText('content');
    const contentMarkdown = yText.toString();

    // Save snapshot for history
    await this.snapshotRepository.saveSnapshot(documentId, snapshot, contentMarkdown);

    // Update document's yjs_state and content_markdown
    await this.documentRepository.update(documentId, {
      yjsState: Buffer.from(snapshot),
      contentMarkdown,
    });

    // Clean up only updates created before the snapshot (not newer ones arriving concurrently)
    await this.updateRepository.deleteBeforeDate(documentId, snapshotTime);
  }
}
