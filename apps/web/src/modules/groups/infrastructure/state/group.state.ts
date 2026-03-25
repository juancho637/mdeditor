import { create } from 'zustand';
import type { Group } from '../../domain/types/group.type';
import type { GroupWithMembers } from '../../domain/types/group-with-members.type';

interface GroupState {
  groups: Group[];
  selectedGroup: GroupWithMembers | null;
  isLoading: boolean;
  error: string | null;
}

interface GroupActions {
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  removeGroup: (id: string) => void;
  setSelectedGroup: (group: GroupWithMembers | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGroupStore = create<GroupState & GroupActions>((set) => ({
  groups: [],
  selectedGroup: null,
  isLoading: false,
  error: null,

  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((s) => ({ groups: [...s.groups, group] })),
  updateGroup: (group) => set((s) => ({
    groups: s.groups.map((g) => (g.id === group.id ? group : g)),
  })),
  removeGroup: (id) => set((s) => ({
    groups: s.groups.filter((g) => g.id !== id),
  })),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
