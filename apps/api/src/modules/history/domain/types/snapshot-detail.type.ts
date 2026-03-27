export type SnapshotDetailType = {
  id: string;
  documentId: string;
  authorId: string | null;
  authorName: string | null;
  contentMarkdown: string;
  createdAt: Date;
};
