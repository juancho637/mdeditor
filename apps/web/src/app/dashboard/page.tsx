'use client';

import { useFolderViewModel } from '@/modules/folders/infrastructure/hooks/use-folder.viewmodel';

export default function DashboardPage() {
  const { selectedFolder } = useFolderViewModel();

  if (selectedFolder) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 48px)' }}>
        <div className="text-center">
          <p className="text-4xl mb-2">📁</p>
          <h2 className="text-lg font-medium mb-1">{selectedFolder.name}</h2>
          <p className="text-sm text-foreground-secondary">
            Esta carpeta está vacía. Los documentos se crearán en la siguiente story.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 48px)' }}>
      <div className="text-center">
        <p className="text-4xl mb-2">📄</p>
        <h2 className="text-lg font-medium mb-1">Bienvenido a markdown</h2>
        <p className="text-sm text-foreground-secondary">
          Crea tu primera carpeta en el sidebar para empezar.
        </p>
      </div>
    </div>
  );
}
