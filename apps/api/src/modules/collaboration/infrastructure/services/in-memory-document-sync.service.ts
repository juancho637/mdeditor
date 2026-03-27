import * as Y from 'yjs';
import { Logger } from '@nestjs/common';
import { DocumentSyncServiceInterface } from '../../domain';
import { LoadDocumentUseCase, ApplyUpdateUseCase, PersistSnapshotUseCase } from '../../application';

interface DocumentEntry {
  doc: Y.Doc;
  connections: number;
  lastActivity: Date;
  snapshotTimer?: ReturnType<typeof setTimeout>;
  releaseTimer?: ReturnType<typeof setTimeout>;
}

const SNAPSHOT_INTERVAL_MS = 60_000;
const RELEASE_TIMEOUT_MS = 300_000;

export class InMemoryDocumentSyncService implements DocumentSyncServiceInterface {
  private readonly documents = new Map<string, DocumentEntry>();
  private readonly loadingPromises = new Map<string, Promise<Y.Doc>>();
  private readonly logger = new Logger(InMemoryDocumentSyncService.name);

  constructor(
    private readonly loadDocumentUseCase: LoadDocumentUseCase,
    private readonly applyUpdateUseCase: ApplyUpdateUseCase,
    private readonly persistSnapshotUseCase: PersistSnapshotUseCase,
  ) {}

  async getOrLoadDocument(documentId: string): Promise<Y.Doc> {
    const existing = this.documents.get(documentId);
    if (existing) {
      if (existing.releaseTimer) {
        clearTimeout(existing.releaseTimer);
        existing.releaseTimer = undefined;
      }
      return existing.doc;
    }

    // Deduplicate concurrent loads for the same document
    const pending = this.loadingPromises.get(documentId);
    if (pending) {
      return pending;
    }

    const loadPromise = this.loadDocumentInternal(documentId);
    this.loadingPromises.set(documentId, loadPromise);
    try {
      return await loadPromise;
    } finally {
      this.loadingPromises.delete(documentId);
    }
  }

  private async loadDocumentInternal(documentId: string): Promise<Y.Doc> {
    this.logger.log(`Loading document ${documentId} into memory`);
    const yDoc = await this.loadDocumentUseCase.run(documentId);

    this.documents.set(documentId, {
      doc: yDoc,
      connections: 0,
      lastActivity: new Date(),
    });

    return yDoc;
  }

  async applyUpdate(documentId: string, update: Uint8Array, authorId: string): Promise<void> {
    const entry = this.documents.get(documentId);
    if (!entry) return;

    // Note: Y.applyUpdate is already called by the gateway before calling this method.
    // This method only handles persistence and snapshot scheduling.
    entry.lastActivity = new Date();

    await this.applyUpdateUseCase.run(documentId, update, authorId);

    this.resetSnapshotTimer(documentId, entry);
  }

  getDocumentConnections(documentId: string): number {
    return this.documents.get(documentId)?.connections ?? 0;
  }

  addConnection(documentId: string): void {
    const entry = this.documents.get(documentId);
    if (entry) {
      entry.connections++;
      // Cancel release timer
      if (entry.releaseTimer) {
        clearTimeout(entry.releaseTimer);
        entry.releaseTimer = undefined;
      }
    }
  }

  async releaseDocument(documentId: string): Promise<void> {
    const entry = this.documents.get(documentId);
    if (!entry) return;

    entry.connections = Math.max(0, entry.connections - 1);

    if (entry.connections === 0) {
      this.logger.log(`Last connection closed for document ${documentId}, scheduling release`);

      // Flush snapshot immediately
      await this.flushSnapshot(documentId, entry);

      // Schedule memory release after timeout
      entry.releaseTimer = setTimeout(() => {
        const current = this.documents.get(documentId);
        if (current && current.connections === 0) {
          if (current.snapshotTimer) clearTimeout(current.snapshotTimer);
          current.doc.destroy();
          this.documents.delete(documentId);
          this.logger.log(`Document ${documentId} released from memory`);
        }
      }, RELEASE_TIMEOUT_MS);
    }
  }

  private resetSnapshotTimer(documentId: string, entry: DocumentEntry): void {
    if (entry.snapshotTimer) {
      clearTimeout(entry.snapshotTimer);
    }

    entry.snapshotTimer = setTimeout(async () => {
      await this.flushSnapshot(documentId, entry);
    }, SNAPSHOT_INTERVAL_MS);
  }

  private async flushSnapshot(documentId: string, entry: DocumentEntry): Promise<void> {
    try {
      if (entry.snapshotTimer) {
        clearTimeout(entry.snapshotTimer);
        entry.snapshotTimer = undefined;
      }
      await this.persistSnapshotUseCase.run(documentId, entry.doc);
      this.logger.log(`Snapshot persisted for document ${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to persist snapshot for document ${documentId}`, (error as Error).stack);
    }
  }
}
