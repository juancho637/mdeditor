'use client';

import { useEffect, useCallback } from 'react';

interface RevokeApiKeyDialogProps {
  isOpen: boolean;
  keyName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RevokeApiKeyDialog({
  isOpen,
  keyName,
  isLoading,
  onConfirm,
  onCancel,
}: RevokeApiKeyDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) onCancel();
    },
    [isOpen, isLoading, onCancel],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      data-testid="revoke-api-key-dialog"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isLoading ? undefined : onCancel}
      />

      <div className="relative bg-background border border-border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-sm font-semibold mb-2">Revocar API Key</h3>
        <p className="text-sm text-foreground-secondary mb-4">
          ¿Revocar API key &ldquo;{keyName}&rdquo;? Las herramientas que usen
          esta key dejarán de funcionar inmediatamente.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
            data-testid="revoke-cancel-button"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            data-testid="revoke-confirm-button"
          >
            {isLoading ? 'Revocando...' : 'Revocar'}
          </button>
        </div>
      </div>
    </div>
  );
}
