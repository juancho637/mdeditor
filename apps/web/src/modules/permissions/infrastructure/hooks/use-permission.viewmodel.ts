'use client';

import { useCallback, useEffect } from 'react';
import { usePermissionStore } from '../state/permission.state';
import { permissionRepository } from '../repositories/permission-v1.repository';

function extractError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { message?: string } } };
    if (ax.response?.data?.message) return String(ax.response.data.message);
  }
  return err instanceof Error ? err.message : fallback;
}

export function usePermissionViewModel() {
  const { permissions, isLoading, error, setPermissions, setLoading, setError } = usePermissionStore();

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await permissionRepository.getAll();
      setPermissions(data);
    } catch (err) {
      setError(extractError(err, 'Error al cargar permisos'));
    } finally {
      setLoading(false);
    }
  }, [setPermissions, setLoading, setError]);

  const setPermission = useCallback(async (
    folderId: string,
    groupId: string,
    permissionLevel: 'view' | 'edit' | null,
  ) => {
    setError(null);
    try {
      await permissionRepository.setPermission(folderId, groupId, permissionLevel);
      await loadPermissions();
      return true;
    } catch (err) {
      setError(extractError(err, 'Error al actualizar permiso'));
      return false;
    }
  }, [loadPermissions, setError]);

  useEffect(() => { loadPermissions(); }, [loadPermissions]);

  return { permissions, isLoading, error, setPermission, loadPermissions };
}
