'use client';

import { useState, useEffect, useRef } from 'react';
import { ConnectionStatus } from '../../domain/enums/connection-status.enum';

interface ConnectionStatusBannerProps {
  connectionStatus: ConnectionStatus;
}

const RECONNECTED_DISMISS_MS = 3_000;

export function ConnectionStatusBanner({ connectionStatus }: ConnectionStatusBannerProps) {
  const [showReconnected, setShowReconnected] = useState(false);
  const prevStatusRef = useRef<ConnectionStatus>(connectionStatus);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = connectionStatus;

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    const wasDisconnected =
      prevStatus === ConnectionStatus.RECONNECTING ||
      prevStatus === ConnectionStatus.OFFLINE;

    if (connectionStatus === ConnectionStatus.CONNECTED && wasDisconnected) {
      setShowReconnected(true);
      dismissTimerRef.current = setTimeout(() => {
        setShowReconnected(false);
      }, RECONNECTED_DISMISS_MS);
    } else {
      setShowReconnected(false);
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [connectionStatus]);

  if (connectionStatus === ConnectionStatus.RECONNECTING) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="px-4 py-2 text-sm text-center transition-opacity duration-300"
        style={{ backgroundColor: 'var(--warning, #F59E0B)', color: '#1a1a1a' }}
        data-testid="connection-banner-reconnecting"
      >
        Reconectando... tus cambios están seguros
      </div>
    );
  }

  if (connectionStatus === ConnectionStatus.OFFLINE) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="px-4 py-2 text-sm text-center transition-opacity duration-300"
        style={{ backgroundColor: 'var(--warning, #F59E0B)', color: '#1a1a1a' }}
        data-testid="connection-banner-offline"
      >
        Sin conexión. Tus cambios se guardarán al reconectar
      </div>
    );
  }

  if (connectionStatus === ConnectionStatus.CONNECTED && showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="px-4 py-2 text-sm text-center transition-opacity duration-300"
        style={{ backgroundColor: '#22c55e', color: '#fff' }}
        data-testid="connection-banner-reconnected"
      >
        Conectado ✓
      </div>
    );
  }

  return null;
}
