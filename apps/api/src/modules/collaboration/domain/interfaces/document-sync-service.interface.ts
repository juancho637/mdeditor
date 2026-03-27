import * as Y from 'yjs';

export interface DocumentSyncServiceInterface {
  getOrLoadDocument(documentId: string): Promise<Y.Doc>;
  applyUpdate(documentId: string, update: Uint8Array, authorId: string): Promise<void>;
  getDocumentConnections(documentId: string): number;
  addConnection(documentId: string): void;
  releaseDocument(documentId: string): Promise<void>;
}
