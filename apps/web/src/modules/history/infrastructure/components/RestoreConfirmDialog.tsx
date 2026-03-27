'use client';

import { useEffect, useCallback } from 'react';
import { formatRelativeDate } from '@/common/helpers/format-relative-date';

interface RestoreConfirmDialogProps {
  isOpen: boolean;
  snapshotDate: string;
  restoring: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RestoreConfirmDialog({
  isOpen,
  snapshotDate,
  restoring,
  onConfirm,
  onCancel,
}: RestoreConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !restoring) onCancel();
    },
    [isOpen, restoring, onCancel],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      data-testid="restore-confirm-dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={restoring ? undefined : onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-sm font-semibold mb-2">Restaurar versión</h3>
        <p className="text-sm text-foreground-secondary mb-4">
          ¿Restaurar documento a la versión de {formatRelativeDate(snapshotDate)}?
          Se creará una nueva entrada en el historial.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={restoring}
            className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
            data-testid="restore-cancel-button"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={restoring}
            className="px-3 py-1.5 text-xs rounded-md bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="restore-confirm-button"
          >
            {restoring ? 'Restaurando...' : 'Restaurar'}
          </button>
        </div>
      </div>
    </div>
  );
}
