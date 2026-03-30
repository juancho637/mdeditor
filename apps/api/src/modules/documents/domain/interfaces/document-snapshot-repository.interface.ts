export interface DocumentSnapshotRepositoryInterface {
  saveSnapshot(
    documentId: string,
    snapshot: Uint8Array,
    contentMarkdown: string,
    authorId?: string,
  ): Promise<void>;
  getLatestSnapshot(
    documentId: string,
  ): Promise<{ yjsSnapshot: Uint8Array; createdAt: Date } | null>;
}
