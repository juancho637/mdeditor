'use client';

import { useState } from 'react';
import { Button } from '@/common/components/ui/button';
import type { FolderTreeNode } from '../../domain/types/folder-tree-node.type';
import { FolderTreeItem } from './FolderTreeItem';
import { useSearchViewModel } from '@/modules/search/infrastructure/hooks/use-search.viewmodel';

interface FolderSidebarProps {
  tree: FolderTreeNode[];
  selectedId: string | null;
  expandedIds: Set<string>;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onToggleSidebar: () => void;
  onRename: (id: string, name: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onCreate: (name: string, parentId: string | null) => Promise<boolean>;
  onDocumentSelect?: () => void;
  asideClassName?: string;
}

export function FolderSidebar({
  tree,
  selectedId,
  expandedIds,
  collapsed,
  onSelect,
  onToggle,
  onToggleSidebar,
  onRename,
  onDelete,
  onCreate,
  onDocumentSelect,
  asideClassName,
}: FolderSidebarProps) {
  const [creatingRoot, setCreatingRoot] = useState(false);
  const [rootName, setRootName] = useState('');
  const { openSearch } = useSearchViewModel();

  if (collapsed) {
    return (
      <div className="w-10 border-r border-border bg-secondary flex flex-col items-center pt-3">
        <button
          onClick={onToggleSidebar}
          className="text-foreground-secondary hover:text-foreground text-sm"
          title="Expandir sidebar"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`w-[260px] border-r border-border bg-secondary flex flex-col shrink-0${asideClassName ? ` ${asideClassName}` : ''}`}
      role="navigation"
      aria-label="Carpetas"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-foreground-secondary uppercase tracking-wider">
          Carpetas
        </span>
        <div className="flex gap-1">
          <button
            onClick={openSearch}
            className="text-xs text-foreground-secondary hover:text-foreground px-1"
            title="Buscar documentos (Ctrl+K)"
          >
            🔍
          </button>
          <button
            onClick={() => setCreatingRoot(true)}
            className="text-xs text-foreground-secondary hover:text-foreground px-1"
            title="Nueva carpeta"
          >
            +
          </button>
          <button
            onClick={onToggleSidebar}
            className="text-xs text-foreground-secondary hover:text-foreground px-1"
            title="Colapsar sidebar"
          >
            ◀
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {creatingRoot && (
          <form
            className="px-2 mb-1"
            onSubmit={async (e) => {
              e.preventDefault();
              if (rootName.trim()) {
                await onCreate(rootName.trim(), null);
                setRootName('');
                setCreatingRoot(false);
              }
            }}
          >
            <input
              className="w-full text-sm bg-background border border-border rounded px-2 py-1"
              placeholder="Nombre de carpeta"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              autoFocus
              onBlur={() => {
                if (!rootName.trim()) setCreatingRoot(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setCreatingRoot(false);
              }}
            />
          </form>
        )}

        {tree.length === 0 && !creatingRoot && (
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-foreground-secondary mb-2">
              No hay carpetas
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreatingRoot(true)}
            >
              Crear carpeta
            </Button>
          </div>
        )}

        {tree.map((node) => (
          <FolderTreeItem
            key={node.id}
            node={node}
            level={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onDocumentSelect={onDocumentSelect}
            onToggle={onToggle}
            onRename={onRename}
            onDelete={onDelete}
            onCreate={onCreate}
          />
        ))}
      </div>
    </aside>
  );
}
