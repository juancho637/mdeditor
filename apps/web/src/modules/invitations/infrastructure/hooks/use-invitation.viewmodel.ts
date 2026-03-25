'use client';

import { useCallback, useEffect } from 'react';
import { useInvitationStore } from '../state/invitation.state';
import { invitationRepository } from '../repositories/invitation-v1.repository';

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    if (axiosErr.response?.data?.message) {
      return String(axiosErr.response.data.message);
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function useInvitationViewModel() {
  const {
    invitations,
    isLoading,
    error,
    setInvitations,
    addInvitation,
    setLoading,
    setError,
  } = useInvitationStore();

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await invitationRepository.list();
      setInvitations(list);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Error al cargar invitaciones'));
    } finally {
      setLoading(false);
    }
  }, [setInvitations, setLoading, setError]);

  const createInvitation = useCallback(
    async (email: string) => {
      setLoading(true);
      setError(null);
      try {
        const invitation = await invitationRepository.create({ email });
        addInvitation(invitation);
        return invitation;
      } catch (err: unknown) {
        setError(extractErrorMessage(err, 'Error al crear invitación'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addInvitation, setLoading, setError],
  );

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  return {
    invitations,
    isLoading,
    error,
    createInvitation,
    loadInvitations,
  };
}
