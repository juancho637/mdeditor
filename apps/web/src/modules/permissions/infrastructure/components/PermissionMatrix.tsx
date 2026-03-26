'use client';

import type { FolderPermission } from '../../domain/types/folder-permission.type';
import type { FolderTreeNode } from '@/modules/folders/domain/types/folder-tree-node.type';
import type { Group } from '@/modules/groups/domain/types/group.type';
import { PermissionLevel } from '../../domain/types/permission-level.enum';

interface PermissionMatrixProps {
  folders: FolderTreeNode[];
  groups: Group[];
  permissions: FolderPermission[];
  onSetPermission: (folderId: string, groupId: string, level: PermissionLevel) => Promise<boolean>;
  onRemovePermission: (permissionId: string) => Promise<boolean>;
}

function flattenTree(nodes: FolderTreeNode[], level = 0): Array<{ node: FolderTreeNode; level: number }> {
  const result: Array<{ node: FolderTreeNode; level: number }> = [];
  for (const node of nodes) {
    result.push({ node, level });
    result.push(...flattenTree(node.children, level + 1));
  }
  return result;
}

function getPermission(
  permissions: FolderPermission[],
  folderId: string,
  groupId: string,
): FolderPermission | null {
  return permissions.find((p) => p.folderId === folderId && p.groupId === groupId) ?? null;
}

export function PermissionMatrix({ folders, groups, permissions, onSetPermission, onRemovePermission }: PermissionMatrixProps) {
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
                const perm = getPermission(permissions, node.id, g.id);
                return (
                  <td key={g.id} className="text-center px-3 py-2">
                    <select
                      value={perm?.permissionLevel ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' && perm) {
                          onRemovePermission(perm.id);
                        } else if (val === PermissionLevel.VIEW || val === PermissionLevel.EDIT) {
                          onSetPermission(node.id, g.id, val);
                        }
                      }}
                      className="text-xs bg-background border border-border rounded px-2 py-1"
                    >
                      <option value="">Sin acceso</option>
                      <option value={PermissionLevel.VIEW}>Ver</option>
                      <option value={PermissionLevel.EDIT}>Editar</option>
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
