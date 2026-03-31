import { apiClient } from '@/common/adapters/api-client';
import { getAccessToken } from '@/common/helpers/token-storage.utils';
import type { DocumentRepository } from '../../domain/repositories/document-repository';
import type { Document } from '../../domain/types/document.type';
import type { DocumentSummary } from '../../domain/types/document-summary.type';
import { PermissionLevel } from '@/modules/permissions/domain/types/permission-level.enum';

interface DocumentWireResponse {
  id: string;
  folder_id: string;
  title: string;
  slug: string;
  content_markdown: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  permission_level?: string;
}

interface DocumentSummaryWireResponse {
  id: string;
  folder_id: string;
  title: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

function mapDocument(wire: DocumentWireResponse): Document {
  return {
    id: wire.id,
    folderId: wire.folder_id,
    title: wire.title,
    slug: wire.slug,
    contentMarkdown: wire.content_markdown,
    createdBy: wire.created_by,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
    permissionLevel: wire.permission_level as PermissionLevel | undefined,
  };
}

function mapSummary(wire: DocumentSummaryWireResponse): DocumentSummary {
  return {
    id: wire.id,
    folderId: wire.folder_id,
    title: wire.title,
    slug: wire.slug,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  };
}

export class DocumentV1Repository implements DocumentRepository {
  async create(title: string, folderId: string): Promise<Document> {
    const response = await apiClient.post<DocumentWireResponse>(
      '/api/documents',
      {
        title,
        folder_id: folderId,
      },
    );
    return mapDocument(response.data);
  }

  async getById(id: string): Promise<Document> {
    const response = await apiClient.get<DocumentWireResponse>(
      `/api/documents/${id}`,
    );
    return mapDocument(response.data);
  }

  async update(
    id: string,
    data: { title?: string; contentMarkdown?: string },
  ): Promise<Document> {
    const wireData: Record<string, string> = {};
    if (data.title !== undefined) wireData.title = data.title;
    if (data.contentMarkdown !== undefined)
      wireData.content_markdown = data.contentMarkdown;
    const response = await apiClient.put<DocumentWireResponse>(
      `/api/documents/${id}`,
      wireData,
    );
    return mapDocument(response.data);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/documents/${id}`);
  }

  async listByFolder(folderId: string): Promise<DocumentSummary[]> {
    const response = await apiClient.get<DocumentSummaryWireResponse[]>(
      `/api/folders/${folderId}/documents`,
    );
    return (response.data as DocumentSummaryWireResponse[]).map(mapSummary);
  }

  async importDocuments(folderId: string, files: File[]): Promise<void> {
    const formData = new FormData();
    formData.append('folder_id', folderId);
    files.forEach((file) => formData.append('files', file));
    const token = getAccessToken();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    const res = await fetch(`${baseUrl}/api/documents/import`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body?.message ?? `Import failed with status ${res.status}`,
      );
    }
  }
}

export const documentRepository = new DocumentV1Repository();
