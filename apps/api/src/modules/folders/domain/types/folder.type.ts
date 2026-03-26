export type FolderType = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};
