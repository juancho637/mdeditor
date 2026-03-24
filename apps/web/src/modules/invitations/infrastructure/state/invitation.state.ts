import { create } from 'zustand';
import type { Invitation } from '../../domain/types/invitation.type';

interface InvitationState {
  invitations: Invitation[];
  isLoading: boolean;
  error: string | null;
}

interface InvitationActions {
  setInvitations: (invitations: Invitation[]) => void;
  addInvitation: (invitation: Invitation) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState: InvitationState = {
  invitations: [],
  isLoading: false,
  error: null,
};

export const useInvitationStore = create<InvitationState & InvitationActions>((set) => ({
  ...initialState,

  setInvitations: (invitations) => set({ invitations }),

  addInvitation: (invitation) =>
    set((state) => ({ invitations: [invitation, ...state.invitations] })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
