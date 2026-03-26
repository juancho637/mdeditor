export type FolderTreeNodeType = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  children: FolderTreeNodeType[];
};
