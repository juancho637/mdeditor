'use client';

import type { FolderPermission } from '../../domain/types/folder-permission.type';
import type { FolderTreeNode } from '@/modules/folders/domain/types/folder-tree-node.type';
import type { Group } from '@/modules/groups/domain/types/group.type';

interface PermissionMatrixProps {
  folders: FolderTreeNode[];
  groups: Group[];
  permissions: FolderPermission[];
  onSetPermission: (folderId: string, groupId: string, level: 'view' | 'edit' | null) => Promise<boolean>;
}

function flattenTree(nodes: FolderTreeNode[], level = 0): Array<{ node: FolderTreeNode; level: number }> {
  const result: Array<{ node: FolderTreeNode; level: number }> = [];
  for (const node of nodes) {
    result.push({ node, level });
    result.push(...flattenTree(node.children, level + 1));
  }
  return result;
}

function getPermissionLevel(
  permissions: FolderPermission[],
  folderId: string,
  groupId: string,
): 'view' | 'edit' | null {
  const perm = permissions.find((p) => p.folderId === folderId && p.groupId === groupId);
  return perm?.permissionLevel ?? null;
}

export function PermissionMatrix({ folders, groups, permissions, onSetPermission }: PermissionMatrixProps) {
  const flatFolders = flattenTree(folders);

  if (flatFolders.length === 0 || groups.length === 0) {
    return (
      <p className="text-sm text-foreground-secondary">
        Necesitas al menos una carpeta y un grupo para configurar permisos.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-3 py-2 font-medium">Carpeta</th>
            {groups.map((g) => (
              <th key={g.id} className="text-center px-3 py-2 font-medium min-w-[120px]">
                {g.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flatFolders.map(({ node, level }) => (
            <tr key={node.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-3 py-2" style={{ paddingLeft: `${12 + level * 20}px` }}>
                📁 {node.name}
              </td>
              {groups.map((g) => {
                const currentLevel = getPermissionLevel(permissions, node.id, g.id);
                return (
                  <td key={g.id} className="text-center px-3 py-2">
                    <select
                      value={currentLevel ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onSetPermission(
                          node.id,
                          g.id,
                          val === '' ? null : (val as 'view' | 'edit'),
                        );
                      }}
                      className="text-xs bg-background border border-border rounded px-2 py-1"
                    >
                      <option value="">Sin acceso</option>
                      <option value="view">Ver</option>
                      <option value="edit">Editar</option>
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
