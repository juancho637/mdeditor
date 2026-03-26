export interface FolderTreeNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: FolderTreeNode[];
}
