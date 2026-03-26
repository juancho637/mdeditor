'use client';

import { useCallback, useEffect } from 'react';
import { useGroupStore } from '../state/group.state';
import { groupRepository } from '../repositories/group-v1.repository';

function extractError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { message?: string } } };
    if (ax.response?.data?.message) return String(ax.response.data.message);
  }
  return err instanceof Error ? err.message : fallback;
}

export function useGroupViewModel() {
  const {
    groups, selectedGroup, isLoading, error,
    setGroups, addGroup, updateGroup, removeGroup,
    setSelectedGroup, setLoading, setError,
  } = useGroupStore();

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await groupRepository.list();
      setGroups(list);
    } catch (err) {
      setError(extractError(err, 'Error al cargar grupos'));
    } finally {
      setLoading(false);
    }
  }, [setGroups, setLoading, setError]);

  const createGroup = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const group = await groupRepository.create(name);
      addGroup(group);
      return group;
    } catch (err) {
      setError(extractError(err, 'Error al crear grupo'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [addGroup, setLoading, setError]);

  const editGroup = useCallback(async (id: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await groupRepository.update(id, name);
      updateGroup(updated);
      return updated;
    } catch (err) {
      setError(extractError(err, 'Error al actualizar grupo'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [updateGroup, setLoading, setError]);

  const deleteGroup = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await groupRepository.delete(id);
      removeGroup(id);
      return true;
    } catch (err) {
      setError(extractError(err, 'Error al eliminar grupo'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [removeGroup, setLoading, setError]);

  const loadGroupDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await groupRepository.getById(id);
      setSelectedGroup(detail);
      return detail;
    } catch (err) {
      setError(extractError(err, 'Error al cargar grupo'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [setSelectedGroup, setLoading, setError]);

  const addUserToGroup = useCallback(async (groupId: string, userId: string) => {
    setError(null);
    try {
      await groupRepository.addUser(groupId, userId);
      await loadGroupDetail(groupId);
      await loadGroups();
      return true;
    } catch (err) {
      setError(extractError(err, 'Error al agregar usuario'));
      return false;
    }
  }, [loadGroupDetail, loadGroups, setError]);

  const removeUserFromGroup = useCallback(async (groupId: string, userId: string) => {
    setError(null);
    try {
      await groupRepository.removeUser(groupId, userId);
      await loadGroupDetail(groupId);
      await loadGroups();
      return true;
    } catch (err) {
      setError(extractError(err, 'Error al remover usuario'));
      return false;
    }
  }, [loadGroupDetail, loadGroups, setError]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  return {
    groups, selectedGroup, isLoading, error,
    createGroup, editGroup, deleteGroup,
    loadGroupDetail, addUserToGroup, removeUserFromGroup,
  };
}
