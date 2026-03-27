'use client';

import { ConnectionStatus } from '../../domain/enums/connection-status.enum';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/common/components/ui/tooltip';

interface ConnectionIndicatorProps {
  connectionStatus: ConnectionStatus;
}

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string; pulse: boolean } | null> = {
  [ConnectionStatus.CONNECTED]: { color: '#22c55e', label: 'Conectado', pulse: false },
  [ConnectionStatus.RECONNECTING]: { color: '#F59E0B', label: 'Reconectando...', pulse: true },
  [ConnectionStatus.OFFLINE]: { color: '#EF4444', label: 'Sin conexión', pulse: false },
  [ConnectionStatus.DISCONNECTED]: null,
};

export function ConnectionIndicator({ connectionStatus }: ConnectionIndicatorProps) {
  const config = STATUS_CONFIG[connectionStatus];
  if (!config) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-block rounded-full shrink-0 ${config.pulse ? 'animate-pulse' : ''}`}
            style={{
              width: 8,
              height: 8,
              backgroundColor: config.color,
            }}
            data-testid="connection-indicator"
            aria-label={config.label}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {config.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
