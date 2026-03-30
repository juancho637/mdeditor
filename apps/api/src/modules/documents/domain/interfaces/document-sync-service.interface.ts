import * as Y from 'yjs';

export type DocumentInvalidatedCallback = (documentId: string) => void;
export type DocumentUpdateBroadcastCallback = (
  documentId: string,
  update: Uint8Array,
) => void;

export interface DocumentSyncServiceInterface {
  getOrLoadDocument(documentId: string): Promise<Y.Doc>;
  applyUpdate(
    documentId: string,
    update: Uint8Array,
    authorId: string,
  ): Promise<void>;
  applyExternalUpdate(
    documentId: string,
    update: Uint8Array,
    authorId: string,
  ): Promise<void>;
  getDocumentConnections(documentId: string): number;
  addConnection(documentId: string): void;
  releaseDocument(documentId: string): Promise<void>;
  forceDocumentReload(documentId: string): void;
  setOnDocumentInvalidated(callback: DocumentInvalidatedCallback): void;
  setOnUpdateBroadcast(callback: DocumentUpdateBroadcastCallback): void;
}
