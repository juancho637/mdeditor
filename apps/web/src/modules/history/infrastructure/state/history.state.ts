import { create } from 'zustand';
import type { SnapshotSummary, SnapshotDetail } from '../../domain/entities/snapshot.entity';
import { historyRepository } from '../repositories/history-v1.repository';
import { getAccessToken } from '@/common/helpers/token-storage.utils';

const PANEL_STORAGE_KEY_PREFIX = 'activity-panel-open';
const SNAPSHOTS_PER_PAGE = 20;

function getPanelStorageKey(): string {
  try {
    const token = getAccessToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]!));
      return `${PANEL_STORAGE_KEY_PREFIX}-${payload.sub}`;
    }
  } catch {
    // fallback to generic key
  }
  return PANEL_STORAGE_KEY_PREFIX;
}

function getStoredPanelState(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(getPanelStorageKey()) === 'true';
  } catch {
    return false;
  }
}

function storePanelState(open: boolean): void {
  try {
    localStorage.setItem(getPanelStorageKey(), String(open));
  } catch {
    // localStorage unavailable
  }
}

export interface HistoryState {
  isPanelOpen: boolean;
  snapshots: SnapshotSummary[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  selectedSnapshot: SnapshotDetail | null;
  previousSnapshot: SnapshotDetail | null;
  loadingDetail: boolean;

  togglePanel: () => void;
  fetchSnapshots: (documentId: string, page?: number) => Promise<void>;
  fetchSnapshotDetail: (documentId: string, snapshotId: string, previousSnapshotId: string | null) => Promise<void>;
  clearSelection: () => void;
  reset: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  isPanelOpen: getStoredPanelState(),
  snapshots: [],
  total: 0,
  page: 1,
  loading: false,
  error: null,
  selectedSnapshot: null,
  previousSnapshot: null,
  loadingDetail: false,

  togglePanel: () => {
    const newState = !get().isPanelOpen;
    storePanelState(newState);
    set({ isPanelOpen: newState });
  },

  fetchSnapshots: async (documentId: string, page = 1) => {
    set({ loading: true, error: null });
    try {
      const response = await historyRepository.listSnapshots(documentId, page, SNAPSHOTS_PER_PAGE);
      if (page === 1) {
        set({
          snapshots: response.snapshots,
          total: response.total,
          page: response.page,
          loading: false,
        });
      } else {
        set((state) => ({
          snapshots: [...state.snapshots, ...response.snapshots],
          total: response.total,
          page: response.page,
          loading: false,
        }));
      }
    } catch {
      set({ error: 'Error al cargar el historial', loading: false });
    }
  },

  fetchSnapshotDetail: async (
    documentId: string,
    snapshotId: string,
    previousSnapshotId: string | null,
  ) => {
    set({ loadingDetail: true });
    try {
      const selected = await historyRepository.getSnapshotDetail(documentId, snapshotId);
      let previous: SnapshotDetail | null = null;
      if (previousSnapshotId) {
        previous = await historyRepository.getSnapshotDetail(documentId, previousSnapshotId);
      }
      set({ selectedSnapshot: selected, previousSnapshot: previous, loadingDetail: false });
    } catch {
      set({ selectedSnapshot: null, previousSnapshot: null, loadingDetail: false, error: 'Error al cargar el detalle del snapshot' });
    }
  },

  clearSelection: () => {
    set({ selectedSnapshot: null, previousSnapshot: null });
  },

  reset: () => {
    set({
      snapshots: [],
      total: 0,
      page: 1,
      loading: false,
      error: null,
      selectedSnapshot: null,
      previousSnapshot: null,
      loadingDetail: false,
    });
  },
}));
