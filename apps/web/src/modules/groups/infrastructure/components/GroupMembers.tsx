'use client';

import { useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import type { GroupWithMembers } from '../../domain/types/group-with-members.type';

interface GroupMembersProps {
  group: GroupWithMembers;
  onAddUser: (groupId: string, userId: string) => Promise<boolean>;
  onRemoveUser: (groupId: string, userId: string) => Promise<boolean>;
  onEditName: (id: string, name: string) => Promise<unknown>;
  isLoading: boolean;
  error: string | null;
}

export function GroupMembers({ group, onAddUser, onRemoveUser, onEditName, isLoading, error }: GroupMembersProps) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [userId, setUserId] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {editingName ? (
          <form
            className="flex gap-2 flex-1"
            onSubmit={async (e) => {
              e.preventDefault();
              if (newName.trim()) {
                await onEditName(group.id, newName.trim());
                setEditingName(false);
              }
            }}
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="sm" disabled={isLoading}>Guardar</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingName(false)}>Cancelar</Button>
          </form>
        ) : (
          <>
            <h3 className="text-lg font-medium flex-1">{group.name}</h3>
            <Button variant="ghost" size="sm" onClick={() => { setNewName(group.name); setEditingName(true); }}>
              Editar nombre
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-2">Agregar usuario</h4>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (userId.trim()) {
              const success = await onAddUser(group.id, userId.trim());
              if (success) setUserId('');
            }
          }}
        >
          <Input
            placeholder="ID del usuario"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={isLoading}>Agregar</Button>
        </form>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">
          Miembros ({group.members.length})
        </h4>
        {group.members.length === 0 ? (
          <p className="text-sm text-foreground-secondary">Este grupo no tiene miembros.</p>
        ) : (
          <div className="border border-border rounded-md divide-y divide-border">
            {group.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-foreground-secondary">{member.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isLoading}
                  onClick={() => onRemoveUser(group.id, member.id)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
