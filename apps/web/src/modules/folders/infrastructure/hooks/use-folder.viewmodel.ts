'use client';

import { useCallback, useEffect } from 'react';
import { useFolderStore } from '../state/folder.state';
import { folderRepository } from '../repositories/folder-v1.repository';

function extractError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { message?: string } } };
    if (ax.response?.data?.message) return String(ax.response.data.message);
  }
  return err instanceof Error ? err.message : fallback;
}

export function useFolderViewModel() {
  const {
    tree, selectedFolder, expandedIds, sidebarCollapsed,
    isLoading, error,
    setTree, setSelectedFolder, toggleExpanded, toggleSidebar,
    setLoading, setError,
  } = useFolderStore();

  const loadTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await folderRepository.getTree();
      setTree(data);
    } catch (err) {
      setError(extractError(err, 'Error al cargar carpetas'));
    } finally {
      setLoading(false);
    }
  }, [setTree, setLoading, setError]);

  const selectFolder = useCallback(async (id: string) => {
    setError(null);
    try {
      const detail = await folderRepository.getById(id);
      setSelectedFolder(detail);
    } catch (err) {
      setError(extractError(err, 'Error al cargar carpeta'));
    }
  }, [setSelectedFolder, setError]);

  const createFolder = useCallback(async (name: string, parentId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      await folderRepository.create(name, parentId);
      await loadTree();
      return true;
    } catch (err) {
      setError(extractError(err, 'Error al crear carpeta'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadTree, setLoading, setError]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      await folderRepository.update(id, name);
      await loadTree();
      if (selectedFolder?.id === id) {
        await selectFolder(id);
      }
      return true;
    } catch (err) {
      setError(extractError(err, 'Error al renombrar carpeta'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadTree, selectFolder, selectedFolder, setLoading, setError]);

  const deleteFolder = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await folderRepository.delete(id);
      if (selectedFolder?.id === id) {
        setSelectedFolder(null);
      }
      await loadTree();
      return true;
    } catch (err) {
      setError(extractError(err, 'Error al eliminar carpeta'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadTree, selectedFolder, setSelectedFolder, setLoading, setError]);

  useEffect(() => { loadTree(); }, [loadTree]);

  return {
    tree, selectedFolder, expandedIds, sidebarCollapsed,
    isLoading, error,
    selectFolder, createFolder, renameFolder, deleteFolder,
    toggleExpanded, toggleSidebar, loadTree,
  };
}
