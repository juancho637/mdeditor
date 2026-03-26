import { FolderRepositoryInterface, FolderType, FolderTreeNodeType } from '../../domain';

function buildTree(folders: FolderType[]): FolderTreeNodeType[] {
  const map = new Map<string, FolderTreeNodeType>();
  const roots: FolderTreeNodeType[] = [];

  for (const f of folders) {
    map.set(f.id, { id: f.id, parentId: f.parentId, name: f.name, slug: f.slug, children: [] });
  }

  for (const f of folders) {
    const node = map.get(f.id)!;
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export class GetFolderTreeUseCase {
  constructor(private readonly folderRepository: FolderRepositoryInterface) {}

  async run(): Promise<FolderTreeNodeType[]> {
    const folders = await this.folderRepository.findAll();
    return buildTree(folders);
  }
}
