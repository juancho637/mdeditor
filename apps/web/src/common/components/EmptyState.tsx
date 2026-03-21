'use client';

import { FolderPlus } from 'lucide-react';
import { Button } from '@/common/components/ui/button';

interface EmptyStateProps {
  variant?: 'workspace';
  onAction?: () => void;
}

export function EmptyState({ variant = 'workspace', onAction }: EmptyStateProps) {
  if (variant === 'workspace') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <FolderPlus className="w-8 h-8 text-foreground-secondary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Bienvenido a markdown
        </h2>
        <p className="text-foreground-secondary mb-6 max-w-sm">
          Crea tu primera carpeta para comenzar a organizar tus notas y
          documentos.
        </p>
        {onAction && (
          <Button
            onClick={onAction}
            style={{ borderRadius: 'var(--radius-btn)' }}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Crear primera carpeta
          </Button>
        )}
      </div>
    );
  }

  return null;
}
