import { FolderType, FolderTreeNodeType } from '../../domain';

export class FolderPresenter {
  static toResponse(folder: FolderType) {
    return {
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      parent_id: folder.parentId,
      created_by: folder.createdBy,
      created_at: folder.createdAt.toISOString(),
      updated_at: folder.updatedAt.toISOString(),
    };
  }

  static toDetailResponse(folder: FolderType, path: Array<{ id: string; name: string }>) {
    return {
      ...FolderPresenter.toResponse(folder),
      path,
    };
  }

  static toTreeResponse(nodes: FolderTreeNodeType[]): unknown[] {
    return nodes.map((node) => ({
      id: node.id,
      name: node.name,
      slug: node.slug,
      parent_id: node.parentId,
      children: FolderPresenter.toTreeResponse(node.children),
    }));
  }
}
