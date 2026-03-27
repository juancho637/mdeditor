'use client';

import { useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCollaborationStore } from '../state/use-collaboration.store';
import { getAccessToken } from '@/common/helpers/token-storage.utils';
import { getColorForUser } from '../helpers/cursor-colors';
import { decodeTokenPayload } from '../helpers/decode-token';
import { ConnectionStatus } from '../../domain/enums/connection-status.enum';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
const OFFLINE_THRESHOLD_MS = 10_000;

export function useCollaborationViewModel() {
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yDocRef = useRef<Y.Doc | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const store = useCollaborationStore();

  const clearOfflineTimer = () => {
    if (offlineTimerRef.current) {
      clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = null;
    }
  };

  const destroyCollaboration = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    clearOfflineTimer();
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (undoManagerRef.current) {
      undoManagerRef.current.destroy();
      undoManagerRef.current = null;
    }
    if (yDocRef.current) {
      yDocRef.current.destroy();
      yDocRef.current = null;
    }
    useCollaborationStore.getState().reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initCollaboration = useCallback((documentId: string) => {
    // Clean up any existing session first
    destroyCollaboration();

    const token = getAccessToken();
    if (!token) return null;

    const yDoc = new Y.Doc();
    const yText = yDoc.getText('content');
    const undoManager = new Y.UndoManager(yText);

    const wsUrl = `${WS_URL}/collaboration`;

    const provider = new WebsocketProvider(wsUrl, documentId, yDoc, {
      params: { token, documentId },
      connect: true,
    });

    // Set awareness local state with user metadata for cursors/presence
    const tokenPayload = decodeTokenPayload(token);
    if (tokenPayload) {
      const userColor = getColorForUser(tokenPayload.sub);
      provider.awareness.setLocalStateField('user', {
        id: tokenPayload.sub,
        name: tokenPayload.name,
        color: userColor.light,
        colorLight: userColor.dark,
        isAI: false,
      });
    }

    provider.on('status', (event: { status: string }) => {
      const storeState = useCollaborationStore.getState();
      storeState.setConnected(event.status === 'connected');

      if (event.status === 'connected') {
        clearOfflineTimer();
        storeState.setConnectionStatus(ConnectionStatus.CONNECTED);
        storeState.setDisconnectedAt(null);
      } else if (event.status === 'disconnected') {
        const currentStatus = useCollaborationStore.getState().connectionStatus;
        // Only set disconnectedAt if transitioning from connected
        if (currentStatus === ConnectionStatus.CONNECTED) {
          storeState.setDisconnectedAt(Date.now());
        }
        storeState.setConnectionStatus(ConnectionStatus.RECONNECTING);

        // Start timer to transition to OFFLINE after 10s
        clearOfflineTimer();
        offlineTimerRef.current = setTimeout(() => {
          useCollaborationStore.getState().setConnectionStatus(ConnectionStatus.OFFLINE);
        }, OFFLINE_THRESHOLD_MS);
      }
    });

    provider.on('synced', (synced: boolean) => {
      useCollaborationStore.getState().setSynced(synced);
    });

    provider.awareness.on('change', () => {
      useCollaborationStore.getState().setConnectedUsers(provider.awareness.getStates().size);
    });

    yDoc.on('update', () => {
      useCollaborationStore.getState().setSaveStatus('syncing');
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        useCollaborationStore.getState().setSaveStatus('synced');
      }, 300);
    });

    yDocRef.current = yDoc;
    undoManagerRef.current = undoManager;
    providerRef.current = provider;

    return { yDoc, yText, provider, undoManager };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    initCollaboration,
    destroyCollaboration,
    isConnected: store.isConnected,
    isSynced: store.isSynced,
    connectedUsers: store.connectedUsers,
    saveStatus: store.saveStatus,
    connectionStatus: store.connectionStatus,
  };
}
