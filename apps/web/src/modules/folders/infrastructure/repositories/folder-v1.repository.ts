import { apiClient } from '@/common/adapters/api-client';
import type { FolderRepository } from '../../domain/repositories/folder-repository';
import type { Folder } from '../../domain/types/folder.type';
import type { FolderTreeNode } from '../../domain/types/folder-tree-node.type';
import type { FolderDetail } from '../../domain/types/folder-detail.type';

interface FolderWireResponse {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface FolderDetailWireResponse extends FolderWireResponse {
  path: Array<{ id: string; name: string }>;
}

interface FolderTreeWireResponse {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  children: FolderTreeWireResponse[];
}

function mapFolder(wire: FolderWireResponse): Folder {
  return {
    id: wire.id,
    name: wire.name,
    slug: wire.slug,
    parentId: wire.parent_id,
    createdBy: wire.created_by,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  };
}

function mapTreeNode(wire: FolderTreeWireResponse): FolderTreeNode {
  return {
    id: wire.id,
    name: wire.name,
    slug: wire.slug,
    parentId: wire.parent_id,
    children: wire.children.map(mapTreeNode),
  };
}

export class FolderV1Repository implements FolderRepository {
  async create(name: string, parentId: string | null): Promise<Folder> {
    const response = await apiClient.post<FolderWireResponse>('/api/folders', {
      name,
      parent_id: parentId,
    });
    return mapFolder(response.data);
  }

  async getTree(): Promise<FolderTreeNode[]> {
    const response = await apiClient.get<FolderTreeWireResponse[]>('/api/folders/tree');
    return (response.data as FolderTreeWireResponse[]).map(mapTreeNode);
  }

  async getById(id: string): Promise<FolderDetail> {
    const response = await apiClient.get<FolderDetailWireResponse>(`/api/folders/${id}`);
    const wire = response.data;
    return {
      ...mapFolder(wire),
      path: wire.path,
    };
  }

  async update(id: string, name: string): Promise<Folder> {
    const response = await apiClient.put<FolderWireResponse>(`/api/folders/${id}`, { name });
    return mapFolder(response.data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/folders/${id}`);
  }
}

export const folderRepository = new FolderV1Repository();
