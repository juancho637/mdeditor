'use client';

import { useCallback } from 'react';
import { useDocumentStore } from '../state/document.state';
import { documentRepository } from '../repositories/document-v1.repository';

function extractError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { message?: string } } };
    if (ax.response?.data?.message) return String(ax.response.data.message);
  }
  return err instanceof Error ? err.message : fallback;
}

export function useDocumentViewModel() {
  const {
    currentDocument,
    folderDocuments,
    saveStatus,
    isLoading,
    error,
    setCurrentDocument,
    setFolderDocuments,
    setSaveStatus,
    setLoading,
    setError,
  } = useDocumentStore();

  const loadDocument = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const doc = await documentRepository.getById(id);
        setCurrentDocument(doc);
      } catch (err) {
        setError(extractError(err, 'Error al cargar documento'));
      } finally {
        setLoading(false);
      }
    },
    [setCurrentDocument, setLoading, setError],
  );

  const loadFolderDocuments = useCallback(
    async (folderId: string) => {
      try {
        const docs = await documentRepository.listByFolder(folderId);
        setFolderDocuments(docs);
      } catch {
        setFolderDocuments([]);
      }
    },
    [setFolderDocuments],
  );

  const createDocument = useCallback(
    async (title: string, folderId: string) => {
      setLoading(true);
      setError(null);
      try {
        const doc = await documentRepository.create(title, folderId);
        setCurrentDocument(doc);
        await loadFolderDocuments(folderId);
        return doc;
      } catch (err) {
        setError(extractError(err, 'Error al crear documento'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setCurrentDocument, loadFolderDocuments, setLoading, setError],
  );

  const saveContent = useCallback(
    async (id: string, contentMarkdown: string) => {
      setSaveStatus('saving');
      try {
        const updated = await documentRepository.update(id, {
          contentMarkdown,
        });
        setCurrentDocument(updated);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    },
    [setCurrentDocument, setSaveStatus],
  );

  const renameDocument = useCallback(
    async (id: string, title: string) => {
      setError(null);
      try {
        const updated = await documentRepository.update(id, { title });
        if (currentDocument?.id === id) setCurrentDocument(updated);
        return true;
      } catch (err) {
        setError(extractError(err, 'Error al renombrar'));
        return false;
      }
    },
    [currentDocument, setCurrentDocument, setError],
  );

  const deleteDocument = useCallback(
    async (id: string, folderId: string) => {
      setError(null);
      try {
        await documentRepository.delete(id);
        if (currentDocument?.id === id) setCurrentDocument(null);
        await loadFolderDocuments(folderId);
        return true;
      } catch (err) {
        setError(extractError(err, 'Error al eliminar documento'));
        return false;
      }
    },
    [currentDocument, setCurrentDocument, loadFolderDocuments, setError],
  );

  const moveDocument = useCallback(
    async (docId: string, targetFolderId: string, currentFolderId: string) => {
      setError(null);
      try {
        const wireData = { folder_id: targetFolderId };
        const response = await (
          await import('@/common/adapters/api-client')
        ).apiClient.patch(`/api/documents/${docId}/move`, wireData);
        const updated = response.data;
        if (currentDocument?.id === docId) {
          setCurrentDocument({
            ...currentDocument,
            folderId: targetFolderId,
          });
        }
        await loadFolderDocuments(currentFolderId);
        return true;
      } catch (err) {
        setError(extractError(err, 'Error al mover documento'));
        return false;
      }
    },
    [currentDocument, setCurrentDocument, loadFolderDocuments, setError],
  );

  const importDocuments = useCallback(
    async (folderId: string, files: File[]) => {
      setLoading(true);
      setError(null);
      try {
        await documentRepository.importDocuments(folderId, files);
        await loadFolderDocuments(folderId);
      } catch (err) {
        setError(extractError(err, 'Error al importar archivos'));
      } finally {
        setLoading(false);
      }
    },
    [loadFolderDocuments, setLoading, setError],
  );

  const exportDocument = useCallback(
    (title: string, contentMarkdown: string) => {
      const blob = new Blob([contentMarkdown], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  return {
    currentDocument,
    folderDocuments,
    saveStatus,
    isLoading,
    error,
    setCurrentDocument,
    loadDocument,
    loadFolderDocuments,
    createDocument,
    saveContent,
    renameDocument,
    deleteDocument,
    moveDocument,
    importDocuments,
    exportDocument,
  };
}
