export interface DocumentUpdateRepositoryInterface {
  saveUpdate(
    documentId: string,
    update: Uint8Array,
    authorId: string,
  ): Promise<void>;
  getUpdatesSince(documentId: string, since: Date): Promise<Uint8Array[]>;
  deleteBeforeDate(documentId: string, before: Date): Promise<void>;
}
