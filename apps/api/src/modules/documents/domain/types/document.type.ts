export type DocumentType = {
  id: string;
  folderId: string;
  title: string;
  slug: string;
  contentMarkdown: string;
  yjsState: Buffer | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};
