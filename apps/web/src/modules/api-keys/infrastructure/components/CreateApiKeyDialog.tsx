'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CreateApiKeyDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<string | null>;
}

enum DialogStep {
  INPUT = 'INPUT',
  RESULT = 'RESULT',
}

export function CreateApiKeyDialog({
  isOpen,
  isLoading,
  onClose,
  onCreate,
}: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<DialogStep>(DialogStep.INPUT);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setRawKey(null);
      setCopied(false);
      setStep(DialogStep.INPUT);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) onClose();
    },
    [isOpen, isLoading, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCreate = async () => {
    if (!name.trim() || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const key = await onCreate(name.trim());
      if (key) {
        setRawKey(key);
        setStep(DialogStep.RESULT);
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const handleCopy = async () => {
    if (!rawKey) return;
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      data-testid="create-api-key-dialog"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isLoading ? undefined : onClose}
      />

      <div className="relative bg-background border border-border rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        {step === DialogStep.INPUT && (
          <>
            <h3 className="text-sm font-semibold mb-4">Generar API Key</h3>
            <div className="mb-4">
              <label
                htmlFor="api-key-name"
                className="block text-xs text-foreground-secondary mb-1"
              >
                Nombre descriptivo
              </label>
              <input
                id="api-key-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Claude Code - MacBook"
                maxLength={100}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="api-key-name-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) handleCreate();
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={isLoading || !name.trim()}
                className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                data-testid="api-key-generate-button"
              >
                {isLoading ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </>
        )}

        {step === DialogStep.RESULT && rawKey && (
          <>
            <h3 className="text-sm font-semibold mb-2">API Key generada</h3>
            <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
              Esta key solo se mostrará una vez. Cópiala ahora.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <code
                className="flex-1 px-3 py-2 text-xs font-mono bg-muted border border-border rounded-md break-all select-all"
                data-testid="api-key-raw-value"
              >
                {rawKey}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 px-3 py-2 text-xs rounded-md border border-border hover:bg-muted transition-colors"
                data-testid="api-key-copy-button"
              >
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                data-testid="api-key-close-button"
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
