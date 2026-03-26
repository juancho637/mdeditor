'use client';

import { useRef, useCallback, useEffect } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCollaborationStore } from '../state/use-collaboration.store';
import { getAccessToken } from '@/common/helpers/token-storage.utils';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

export function useCollaborationViewModel() {
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yDocRef = useRef<Y.Doc | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  const {
    isConnected, isSynced, connectedUsers, saveStatus,
    setConnected, setSynced, setConnectedUsers, setSaveStatus, reset,
  } = useCollaborationStore();

  const initCollaboration = useCallback((documentId: string) => {
    // Clean up any existing session
    if (providerRef.current) {
      providerRef.current.destroy();
    }
    if (yDocRef.current) {
      yDocRef.current.destroy();
    }

    reset();

    const token = getAccessToken();
    if (!token) return null;

    const yDoc = new Y.Doc();
    const yText = yDoc.getText('content');
    const undoManager = new Y.UndoManager(yText);

    // Build WebSocket URL with auth params
    const wsUrl = `${WS_URL}/collaboration`;

    const provider = new WebsocketProvider(wsUrl, documentId, yDoc, {
      params: { token, documentId },
      connect: true,
    });

    // Listen for connection status
    provider.on('status', (event: { status: string }) => {
      setConnected(event.status === 'connected');
      if (event.status === 'connected') {
        setSaveStatus('synced');
      }
    });

    provider.on('synced', (event: { synced: boolean }) => {
      setSynced(event.synced);
    });

    // Track connected users via awareness
    provider.awareness.on('change', () => {
      setConnectedUsers(provider.awareness.getStates().size);
    });

    // Listen for doc updates to show syncing status
    yDoc.on('update', () => {
      setSaveStatus('syncing');
      // Auto-transition to synced after a brief delay
      setTimeout(() => setSaveStatus('synced'), 300);
    });

    yDocRef.current = yDoc;
    yTextRef.current = yText;
    undoManagerRef.current = undoManager;
    providerRef.current = provider;

    return { yDoc, yText, provider, undoManager };
  }, [reset, setConnected, setSynced, setConnectedUsers, setSaveStatus]);

  const destroyCollaboration = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.disconnect();
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
    yTextRef.current = null;
    reset();
  }, [reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyCollaboration();
    };
  }, [destroyCollaboration]);

  return {
    initCollaboration,
    destroyCollaboration,
    yText: yTextRef.current,
    provider: providerRef.current,
    undoManager: undoManagerRef.current,
    isConnected,
    isSynced,
    connectedUsers,
    saveStatus,
  };
}
