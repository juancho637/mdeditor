'use client';

import type { AwarenessUser } from '../../domain/entities/awareness-user';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/common/components/ui/tooltip';

const MAX_VISIBLE = 4;

interface PresenceIndicatorProps {
  users: AwarenessUser[];
}

function UserAvatar({ user, style }: { user: AwarenessUser; style?: React.CSSProperties }) {
  const initial = user.isAI ? '🤖' : user.name.charAt(0).toUpperCase();
  const bgColor = user.isAI ? '#9333EA' : user.color;
  const isActive = user.isEditing && !user.isInactive;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="relative flex items-center justify-center rounded-full text-white text-[11px] font-medium select-none shrink-0"
          style={{
            width: 24,
            height: 24,
            backgroundColor: bgColor,
            border: '2px solid var(--background)',
            ...style,
          }}
          data-testid="presence-avatar"
        >
          {initial}
          {isActive && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--background)]"
              style={{ backgroundColor: bgColor }}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <span>{user.isAI ? 'Claude — editando vía MCP' : `${user.name} — ${user.isEditing ? 'Editando' : 'Viendo'}`}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function PresenceIndicator({ users }: PresenceIndicatorProps) {
  if (users.length === 0) return null;

  const visibleUsers = users.slice(0, MAX_VISIBLE);
  const overflowCount = users.length - MAX_VISIBLE;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center" data-testid="presence-indicator">
        {visibleUsers.map((user, index) => (
          <UserAvatar
            key={user.clientId}
            user={user}
            style={index > 0 ? { marginLeft: -6 } : undefined}
          />
        ))}
        {overflowCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center justify-center rounded-full bg-muted text-foreground-secondary text-[10px] font-medium select-none shrink-0"
                style={{
                  width: 24,
                  height: 24,
                  marginLeft: -6,
                  border: '2px solid var(--background)',
                }}
                data-testid="presence-overflow"
              >
                +{overflowCount}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div className="flex flex-col gap-0.5">
                {users.slice(MAX_VISIBLE).map((user) => (
                  <span key={user.clientId}>
                    {user.name} — {user.isEditing ? 'Editando' : 'Viendo'}
                  </span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
