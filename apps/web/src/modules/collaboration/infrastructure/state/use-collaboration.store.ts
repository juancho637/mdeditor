import { create } from 'zustand';
import { ConnectionStatus } from '../../domain/enums/connection-status.enum';

type CollaborationSaveStatus = 'idle' | 'syncing' | 'synced';

interface CollaborationStoreState {
  isConnected: boolean;
  isSynced: boolean;
  connectedUsers: number;
  saveStatus: CollaborationSaveStatus;
  connectionStatus: ConnectionStatus;
  disconnectedAt: number | null;
}

interface CollaborationStoreActions {
  setConnected: (isConnected: boolean) => void;
  setSynced: (isSynced: boolean) => void;
  setConnectedUsers: (count: number) => void;
  setSaveStatus: (status: CollaborationSaveStatus) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setDisconnectedAt: (ts: number | null) => void;
  reset: () => void;
}

const initialState: CollaborationStoreState = {
  isConnected: false,
  isSynced: false,
  connectedUsers: 0,
  saveStatus: 'idle',
  connectionStatus: ConnectionStatus.DISCONNECTED,
  disconnectedAt: null,
};

export const useCollaborationStore = create<CollaborationStoreState & CollaborationStoreActions>((set) => ({
  ...initialState,
  setConnected: (isConnected) => set({ isConnected }),
  setSynced: (isSynced) => set({ isSynced }),
  setConnectedUsers: (connectedUsers) => set({ connectedUsers }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setDisconnectedAt: (disconnectedAt) => set({ disconnectedAt }),
  reset: () => set(initialState),
}));
