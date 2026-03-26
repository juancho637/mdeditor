import { create } from 'zustand';

type CollaborationSaveStatus = 'idle' | 'syncing' | 'synced';

interface CollaborationStoreState {
  isConnected: boolean;
  isSynced: boolean;
  connectedUsers: number;
  saveStatus: CollaborationSaveStatus;
}

interface CollaborationStoreActions {
  setConnected: (isConnected: boolean) => void;
  setSynced: (isSynced: boolean) => void;
  setConnectedUsers: (count: number) => void;
  setSaveStatus: (status: CollaborationSaveStatus) => void;
  reset: () => void;
}

const initialState: CollaborationStoreState = {
  isConnected: false,
  isSynced: false,
  connectedUsers: 0,
  saveStatus: 'idle',
};

export const useCollaborationStore = create<CollaborationStoreState & CollaborationStoreActions>((set) => ({
  ...initialState,
  setConnected: (isConnected) => set({ isConnected }),
  setSynced: (isSynced) => set({ isSynced }),
  setConnectedUsers: (connectedUsers) => set({ connectedUsers }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  reset: () => set(initialState),
}));
