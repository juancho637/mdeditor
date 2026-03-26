import type { Folder } from './folder.type';

export interface FolderDetail extends Folder {
  path: Array<{ id: string; name: string }>;
}
