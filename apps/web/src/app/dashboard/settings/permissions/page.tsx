'use client';

import { PermissionMatrix } from '@/modules/permissions/infrastructure/components/PermissionMatrix';
import { usePermissionViewModel } from '@/modules/permissions/infrastructure/hooks/use-permission.viewmodel';
import { useFolderViewModel } from '@/modules/folders/infrastructure/hooks/use-folder.viewmodel';
import { useGroupViewModel } from '@/modules/groups/infrastructure/hooks/use-group.viewmodel';

export default function SettingsPermissionsPage() {
  const { permissions, isLoading, error, setPermission } = usePermissionViewModel();
  const { tree } = useFolderViewModel();
  const { groups } = useGroupViewModel();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">Permisos por carpeta</h2>
        <p className="text-sm text-foreground-secondary mb-4">
          Asigna permisos de visualización o edición para cada grupo en cada carpeta.
          Editar incluye Ver automáticamente.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
      )}

      {isLoading ? (
        <p className="text-sm text-foreground-secondary">Cargando...</p>
      ) : (
        <PermissionMatrix
          folders={tree}
          groups={groups}
          permissions={permissions}
          onSetPermission={setPermission}
        />
      )}
    </div>
  );
}
