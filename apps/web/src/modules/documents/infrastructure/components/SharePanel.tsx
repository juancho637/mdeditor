'use client';

import { useEffect, useRef, useState } from 'react';
import type { DocumentShare } from '../../domain/types/document-share.type';

interface SharePanelProps {
  documentId: string;
  onClose: () => void;
  onCreateShare: (documentId: string) => Promise<DocumentShare | null>;
  onGetShare: (documentId: string) => Promise<DocumentShare | null>;
  onRevokeShare: (documentId: string) => Promise<boolean>;
}

type PanelState = 'loading' | 'no-share' | 'has-share' | 'revoking';

export function SharePanel({
  documentId,
  onClose,
  onCreateShare,
  onGetShare,
  onRevokeShare,
}: SharePanelProps) {
  const [panelState, setPanelState] = useState<PanelState>('loading');
  const [share, setShare] = useState<DocumentShare | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onGetShare(documentId).then((existing) => {
      if (existing) {
        setShare(existing);
        setPanelState('has-share');
      } else {
        // AC#1: generar automáticamente al abrir si no existe share
        onCreateShare(documentId).then((created) => {
          if (created) {
            setShare(created);
            setPanelState('has-share');
          } else {
            setPanelState('no-share');
          }
        });
      }
    });
  }, [documentId, onGetShare, onCreateShare]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleGenerate = async () => {
    setPanelState('loading');
    const created = await onCreateShare(documentId);
    if (created) {
      setShare(created);
      setPanelState('has-share');
    } else {
      setPanelState('no-share');
    }
  };

  const handleCopy = async () => {
    if (!share) return;
    const fullUrl = `${window.location.origin}${share.shareUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      return;
    }
    setPanelState('revoking');
    const ok = await onRevokeShare(documentId);
    if (ok) {
      setShare(null);
      setPanelState('no-share');
    } else {
      setPanelState('has-share');
    }
    setConfirmRevoke(false);
  };

  const shareUrl = share
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${share.shareUrl}`
    : '';

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1 z-50 w-80 bg-background border border-border rounded-lg shadow-lg p-4"
      data-testid="share-panel"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Compartir documento</h3>
        <button
          onClick={onClose}
          className="text-foreground-secondary hover:text-foreground text-xs"
          aria-label="Cerrar panel"
        >
          ✕
        </button>
      </div>

      {panelState === 'loading' || panelState === 'revoking' ? (
        <div className="text-xs text-foreground-secondary text-center py-2">
          {panelState === 'revoking' ? 'Revocando...' : 'Cargando...'}
        </div>
      ) : panelState === 'no-share' ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-foreground-secondary">
            No se pudo generar el link. Intenta de nuevo.
          </p>
          <button
            onClick={handleGenerate}
            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
            data-testid="generate-share-link-btn"
          >
            Generar link público
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-foreground-secondary mb-1">
            Link público activo:
          </p>
          <div className="flex gap-1">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 text-xs bg-muted border border-border rounded px-2 py-1.5 min-w-0"
              data-testid="share-url-input"
            />
            <button
              onClick={handleCopy}
              className="text-xs bg-muted border border-border px-2 py-1.5 rounded-md hover:bg-muted/80 transition-colors whitespace-nowrap"
              data-testid="copy-share-link-btn"
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <button
            onClick={handleRevoke}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors mt-1 ${
              confirmRevoke
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'text-destructive hover:bg-destructive/10'
            }`}
            data-testid="revoke-share-btn"
          >
            {confirmRevoke ? 'Confirmar revocación' : 'Revocar acceso'}
          </button>
          {confirmRevoke && (
            <button
              onClick={() => setConfirmRevoke(false)}
              className="text-xs text-foreground-secondary hover:text-foreground"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
