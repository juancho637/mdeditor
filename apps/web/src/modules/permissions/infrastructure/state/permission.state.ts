import { create } from 'zustand';
import type { FolderPermission } from '../../domain/types/folder-permission.type';

interface PermissionState {
  permissions: FolderPermission[];
  isLoading: boolean;
  error: string | null;
}

interface PermissionActions {
  setPermissions: (permissions: FolderPermission[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePermissionStore = create<PermissionState & PermissionActions>((set) => ({
  permissions: [],
  isLoading: false,
  error: null,

  setPermissions: (permissions) => set({ permissions }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
