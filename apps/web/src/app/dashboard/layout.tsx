'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthViewModel } from '@/modules/auth/infrastructure/hooks/use-auth.viewmodel';
import { FolderSidebar } from '@/modules/folders/infrastructure/components/FolderSidebar';
import { FolderBreadcrumbs } from '@/modules/folders/infrastructure/components/FolderBreadcrumbs';
import { useFolderViewModel } from '@/modules/folders/infrastructure/hooks/use-folder.viewmodel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuthViewModel();
  const router = useRouter();
  const pathname = usePathname();
  const isSettingsPage = pathname.startsWith('/dashboard/settings');

  const {
    tree, selectedFolder, expandedIds, sidebarCollapsed,
    selectFolder, createFolder, renameFolder, deleteFolder,
    toggleExpanded, toggleSidebar,
  } = useFolderViewModel();

  const handleLogout = async () => {
    await logout();
    router.push('/sign-in');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-semibold text-foreground">
            markdown
          </Link>
          {selectedFolder && !isSettingsPage && (
            <FolderBreadcrumbs
              path={selectedFolder.path}
              onNavigate={selectFolder}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings/users"
            className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            Configuración
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isSettingsPage && (
          <FolderSidebar
            tree={tree}
            selectedId={selectedFolder?.id ?? null}
            expandedIds={expandedIds}
            collapsed={sidebarCollapsed}
            onSelect={selectFolder}
            onToggle={toggleExpanded}
            onToggleSidebar={toggleSidebar}
            onRename={renameFolder}
            onDelete={deleteFolder}
            onCreate={createFolder}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
