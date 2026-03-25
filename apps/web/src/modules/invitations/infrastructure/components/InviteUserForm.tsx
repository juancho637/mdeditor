'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { Label } from '@/common/components/ui/label';

interface InviteUserFormProps {
  onInvite: (email: string) => Promise<{ invitationLink?: string } | null>;
  isLoading: boolean;
  error: string | null;
}

export function InviteUserForm({ onInvite, isLoading, error }: InviteUserFormProps) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const validateEmail = (value: string): string | null => {
    if (!value.trim()) return 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
    return null;
  };

  const handleBlur = useCallback(() => {
    setFieldError(validateEmail(email));
  }, [email]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateEmail(email);
      setFieldError(validationError);
      if (validationError) return;

      const result = await onInvite(email.trim());
      if (result) {
        setCopiedLink(result.invitationLink ?? null);
        setEmail('');
        setFieldError(null);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    },
    [email, onInvite],
  );

  const handleCopy = useCallback(async () => {
    if (!copiedLink) return;
    await navigator.clipboard.writeText(copiedLink);
  }, [copiedLink]);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="invite-email">Email del nuevo usuario</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="usuario@equipo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleBlur}
            disabled={isLoading}
            className={fieldError ? 'border-destructive' : ''}
          />
          {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
        </div>
        <Button type="submit" disabled={isLoading} style={{ borderRadius: 'var(--radius-btn)' }}>
          {isLoading ? 'Invitando...' : 'Invitar'}
        </Button>
      </form>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {copiedLink && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <code className="text-xs flex-1 truncate">{copiedLink}</code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            Copiar
          </Button>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-4 right-4 p-3 bg-green-100 text-green-800 rounded-md text-sm shadow-lg z-50">
          Invitación creada
        </div>
      )}
    </div>
  );
}
