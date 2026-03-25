'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { Label } from '@/common/components/ui/label';

interface GroupFormProps {
  initialName?: string;
  onSubmit: (name: string) => Promise<unknown>;
  isLoading: boolean;
  submitLabel: string;
}

export function GroupForm({ initialName = '', onSubmit, isLoading, submitLabel }: GroupFormProps) {
  const [name, setName] = useState(initialName);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) {
        setFieldError('El nombre es requerido');
        return;
      }
      setFieldError(null);
      const result = await onSubmit(name.trim());
      if (result) setName('');
    },
    [name, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="group-name">Nombre del grupo</Label>
        <Input
          id="group-name"
          type="text"
          placeholder="Ej: Marketing"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          className={fieldError ? 'border-destructive' : ''}
        />
        {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
      </div>
      <Button type="submit" disabled={isLoading} style={{ borderRadius: 'var(--radius-btn)' }}>
        {isLoading ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  );
}
