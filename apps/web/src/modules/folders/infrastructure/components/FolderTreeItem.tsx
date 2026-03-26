'use client';

import { useState } from 'react';
import type { FolderTreeNode } from '../../domain/types/folder-tree-node.type';

interface FolderTreeItemProps {
  node: FolderTreeNode;
  level: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onRename: (id: string, name: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onCreate: (name: string, parentId: string) => Promise<boolean>;
}

export function FolderTreeItem({
  node, level, selectedId, expandedIds,
  onSelect, onToggle, onRename, onDelete, onCreate,
}: FolderTreeItemProps) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  const [showMenu, setShowMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [creating, setCreating] = useState(false);
  const [childName, setChildName] = useState('');

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-sm rounded-md transition-colors ${
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => { onSelect(node.id); if (hasChildren) onToggle(node.id); }}
        onContextMenu={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
      >
        <span className="w-4 text-xs text-foreground-secondary">
          {hasChildren ? (isExpanded ? '▼' : '▶') : ''}
        </span>

        {renaming ? (
          <form
            className="flex-1 flex gap-1"
            onSubmit={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (newName.trim()) {
                await onRename(node.id, newName.trim());
                setRenaming(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              className="flex-1 text-sm bg-background border border-border rounded px-1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onBlur={() => setRenaming(false)}
              onKeyDown={(e) => { if (e.key === 'Escape') setRenaming(false); }}
            />
          </form>
        ) : (
          <span className="flex-1 truncate">📁 {node.name}</span>
        )}

        <button
          className="opacity-0 group-hover:opacity-100 text-xs text-foreground-secondary hover:text-foreground px-1"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
        >
          ⋯
        </button>
      </div>

      {showMenu && (
        <div
          className="ml-8 mb-1 bg-background border border-border rounded-md shadow-md text-sm z-10"
          style={{ marginLeft: `${24 + level * 16}px` }}
        >
          <button
            className="block w-full text-left px-3 py-1.5 hover:bg-muted"
            onClick={() => { setRenaming(true); setNewName(node.name); setShowMenu(false); }}
          >
            Renombrar
          </button>
          <button
            className="block w-full text-left px-3 py-1.5 hover:bg-muted"
            onClick={() => { setCreating(true); setShowMenu(false); }}
          >
            Nueva subcarpeta
          </button>
          <button
            className="block w-full text-left px-3 py-1.5 hover:bg-muted text-destructive"
            onClick={() => { setConfirmDelete(true); setShowMenu(false); }}
          >
            Eliminar
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="ml-8 mb-1 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm" style={{ marginLeft: `${24 + level * 16}px` }}>
          <p className="mb-2">Eliminar "{node.name}" y todo su contenido?</p>
          <div className="flex gap-2">
            <button
              className="px-2 py-1 bg-destructive text-white rounded text-xs"
              onClick={async () => { await onDelete(node.id); setConfirmDelete(false); }}
            >
              Eliminar grupo
            </button>
            <button
              className="px-2 py-1 border border-border rounded text-xs"
              onClick={() => setConfirmDelete(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {creating && (
        <form
          className="flex gap-1 mb-1"
          style={{ marginLeft: `${24 + level * 16}px` }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (childName.trim()) {
              await onCreate(childName.trim(), node.id);
              setChildName('');
              setCreating(false);
            }
          }}
        >
          <input
            className="flex-1 text-sm bg-background border border-border rounded px-1 py-0.5"
            placeholder="Nombre de subcarpeta"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            autoFocus
            onBlur={() => { if (!childName.trim()) setCreating(false); }}
            onKeyDown={(e) => { if (e.key === 'Escape') setCreating(false); }}
          />
        </form>
      )}

      {isExpanded && node.children.map((child) => (
        <FolderTreeItem
          key={child.id}
          node={child}
          level={level + 1}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onSelect={onSelect}
          onToggle={onToggle}
          onRename={onRename}
          onDelete={onDelete}
          onCreate={onCreate}
        />
      ))}
    </div>
  );
}
