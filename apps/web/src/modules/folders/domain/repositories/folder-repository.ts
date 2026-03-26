import type { Folder } from '../types/folder.type';
import type { FolderTreeNode } from '../types/folder-tree-node.type';
import type { FolderDetail } from '../types/folder-detail.type';

export interface FolderRepository {
  create(name: string, parentId: string | null): Promise<Folder>;
  getTree(): Promise<FolderTreeNode[]>;
  getById(id: string): Promise<FolderDetail>;
  update(id: string, name: string): Promise<Folder>;
  delete(id: string): Promise<void>;
}
