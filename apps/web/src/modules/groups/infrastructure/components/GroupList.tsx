'use client';

import { useState } from 'react';
import { Button } from '@/common/components/ui/button';
import type { Group } from '../../domain/types/group.type';

interface GroupListProps {
  groups: Group[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  isLoading: boolean;
}

export function GroupList({ groups, onSelect, onDelete, isLoading }: GroupListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (groups.length === 0) {
    return <p className="text-sm text-foreground-secondary">No hay grupos creados.</p>;
  }

  return (
    <div className="border border-border rounded-md divide-y divide-border">
      {groups.map((group) => (
        <div key={group.id} className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => onSelect(group.id)}
            className="text-left flex-1 hover:text-primary transition-colors"
          >
            <p className="text-sm font-medium">{group.name}</p>
            <p className="text-xs text-foreground-secondary">
              {group.memberCount} {group.memberCount === 1 ? 'miembro' : 'miembros'}
            </p>
          </button>

          {confirmDeleteId === group.id ? (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={isLoading}
                onClick={async () => {
                  await onDelete(group.id);
                  setConfirmDeleteId(null);
                }}
              >
                Eliminar grupo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDeleteId(group.id)}
              className="text-destructive hover:text-destructive"
            >
              Eliminar
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
