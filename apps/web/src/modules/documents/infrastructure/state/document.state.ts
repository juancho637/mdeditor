import { create } from 'zustand';
import type { Document } from '../../domain/types/document.type';
import type { DocumentSummary } from '../../domain/types/document-summary.type';

type SaveStatus = 'idle' | 'saving' | 'saved';

interface DocumentState {
  currentDocument: Document | null;
  folderDocuments: DocumentSummary[];
  saveStatus: SaveStatus;
  isLoading: boolean;
  error: string | null;
}

interface DocumentActions {
  setCurrentDocument: (doc: Document | null) => void;
  setFolderDocuments: (docs: DocumentSummary[]) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDocumentStore = create<DocumentState & DocumentActions>((set) => ({
  currentDocument: null,
  folderDocuments: [],
  saveStatus: 'idle',
  isLoading: false,
  error: null,

  setCurrentDocument: (currentDocument) => set({ currentDocument }),
  setFolderDocuments: (folderDocuments) => set({ folderDocuments }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
