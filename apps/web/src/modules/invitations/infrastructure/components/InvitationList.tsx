'use client';

import type { Invitation } from '../../domain/types/invitation.type';

interface InvitationListProps {
  invitations: Invitation[];
}

export function InvitationList({ invitations }: InvitationListProps) {
  if (invitations.length === 0) {
    return (
      <p className="text-sm text-foreground-secondary">
        No hay invitaciones pendientes.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Invitaciones</h3>
      <div className="border border-border rounded-md divide-y divide-border">
        {invitations.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{inv.email}</p>
              <p className="text-xs text-foreground-secondary">
                {new Date(inv.createdAt).toLocaleDateString('es')}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                inv.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {inv.status === 'pending' ? 'Pendiente' : 'Aceptada'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
