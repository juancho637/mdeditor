import { create } from 'zustand';
import type { FolderTreeNode } from '../../domain/types/folder-tree-node.type';
import type { FolderDetail } from '../../domain/types/folder-detail.type';

interface FolderState {
  tree: FolderTreeNode[];
  selectedFolder: FolderDetail | null;
  expandedIds: Set<string>;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

interface FolderActions {
  setTree: (tree: FolderTreeNode[]) => void;
  setSelectedFolder: (folder: FolderDetail | null) => void;
  toggleExpanded: (id: string) => void;
  toggleSidebar: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFolderStore = create<FolderState & FolderActions>((set) => ({
  tree: [],
  selectedFolder: null,
  expandedIds: new Set<string>(),
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  isLoading: false,
  error: null,

  setTree: (tree) => set({ tree }),
  setSelectedFolder: (selectedFolder) => set({ selectedFolder }),
  toggleExpanded: (id) =>
    set((s) => {
      const next = new Set(s.expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedIds: next };
    }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
