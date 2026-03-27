'use client';

import type { AwarenessUser } from '@/modules/collaboration/domain/entities/awareness-user';

interface LiveActivitySectionProps {
  connectedUsers: AwarenessUser[];
}

function UserAvatar({ user }: { user: AwarenessUser }) {
  if (user.isAI) {
    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
        style={{ backgroundColor: '#9333EA' }}
      >
        🤖
      </div>
    );
  }

  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
      style={{ backgroundColor: user.color }}
    >
      {(user.name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export function LiveActivitySection({ connectedUsers }: LiveActivitySectionProps) {
  if (connectedUsers.length === 0) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-foreground-secondary">No hay otros usuarios conectados</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 space-y-2">
      {connectedUsers.map((user) => (
        <div key={user.clientId} className="flex items-center gap-2">
          <UserAvatar user={user} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {user.isAI ? '🤖 Claude (vía MCP)' : user.name}
            </p>
            <p className="text-xs text-foreground-secondary">
              {user.isEditing ? 'Editando' : 'Viendo'}
              <span className="ml-1">· ahora</span>
            </p>
          </div>
          {user.isEditing && (
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
