'use client';

import { useState, useEffect, useRef } from 'react';
import type { AwarenessUser } from '../../domain/entities/awareness-user';

const INACTIVITY_THRESHOLD_MS = 30_000;

interface AwarenessUserState {
  user?: {
    id: string;
    name: string;
    color: string;
    colorLight: string;
    isAI: boolean;
  };
  cursor?: { anchor: number; head: number } | null;
}

export function usePresence(awareness: any | null) {
  const [connectedUsers, setConnectedUsers] = useState<AwarenessUser[]>([]);
  const lastActivityRef = useRef<Map<number, number>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!awareness) {
      setConnectedUsers([]);
      return;
    }

    const buildUserList = () => {
      const states = awareness.getStates() as Map<number, AwarenessUserState>;
      const localClientId = awareness.clientID;
      const now = Date.now();
      const users: AwarenessUser[] = [];

      states.forEach((state, clientId) => {
        if (clientId === localClientId) return;
        if (!state.user) return;

        const lastActivity = lastActivityRef.current.get(clientId) ?? now;
        const isInactive = now - lastActivity > INACTIVITY_THRESHOLD_MS;

        users.push({
          clientId,
          id: state.user.id,
          name: state.user.name,
          color: state.user.color,
          colorLight: state.user.colorLight,
          isAI: state.user.isAI ?? false,
          isEditing: !isInactive && (state.cursor != null),
          isInactive,
        });
      });

      setConnectedUsers(users);
    };

    const handleChange = (changes: { added: number[]; updated: number[]; removed: number[] }) => {
      const now = Date.now();
      // Track activity for added/updated remote clients
      for (const clientId of [...changes.added, ...changes.updated]) {
        if (clientId !== awareness.clientID) {
          lastActivityRef.current.set(clientId, now);
        }
      }
      // Clean up activity tracking for removed clients
      for (const clientId of changes.removed) {
        lastActivityRef.current.delete(clientId);
      }
      buildUserList();
    };

    awareness.on('change', handleChange);
    buildUserList();

    // Periodic check for inactivity
    intervalRef.current = setInterval(buildUserList, 5000);

    return () => {
      awareness.off('change', handleChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastActivityRef.current.clear();
    };
  }, [awareness]);

  return { connectedUsers };
}
