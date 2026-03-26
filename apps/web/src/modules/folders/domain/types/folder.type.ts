export interface Folder {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
