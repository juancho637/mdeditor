'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuthViewModel } from '@/modules/auth/infrastructure/hooks/use-auth.viewmodel';
import { FolderSidebar } from '@/modules/folders/infrastructure/components/FolderSidebar';
import { FolderBreadcrumbs } from '@/modules/folders/infrastructure/components/FolderBreadcrumbs';
import { useFolderViewModel } from '@/modules/folders/infrastructure/hooks/use-folder.viewmodel';
import { ThemeToggle } from '@/modules/theme/infrastructure/components/ThemeToggle';
import { useThemeStore } from '@/modules/theme/infrastructure/state/theme.state';
import { CommandPalette } from '@/modules/search/infrastructure/components/CommandPalette';
import { useSearchViewModel } from '@/modules/search/infrastructure/hooks/use-search.viewmodel';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/common/components/ui/sheet';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuthViewModel();
  const router = useRouter();
  const pathname = usePathname();

  // Derive selected folder from URL: /dashboard/[folderId]/...
  const segments = pathname.split('/');
  const rawSegment = segments.length >= 3 ? segments[2] : null;
  const folderIdFromUrl =
    rawSegment && rawSegment !== 'settings' ? rawSegment : null;

  const {
    tree,
    selectedFolder,
    expandedIds,
    sidebarCollapsed,
    mobileSidebarOpen,
    selectFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleExpanded,
    toggleSidebar,
    openMobileSidebar,
    closeMobileSidebar,
  } = useFolderViewModel();

  const initTheme = useThemeStore((s) => s.initTheme);
  const { isOpen: isSearchOpen, openSearch } = useSearchViewModel();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Close mobile Sheet when search opens — avoids Radix focus trap blocking the input
  useEffect(() => {
    if (isSearchOpen && mobileSidebarOpen) {
      closeMobileSidebar();
    }
  }, [isSearchOpen, mobileSidebarOpen, closeMobileSidebar]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [openSearch]);

  const handleLogout = async () => {
    await logout();
    router.push('/sign-in');
  };

  const handleFolderSelect = (id: string) => {
    router.push(`/dashboard/${id}`);
  };

  const sidebarProps = {
    tree,
    selectedId: folderIdFromUrl,
    expandedIds,
    collapsed: sidebarCollapsed,
    onSelect: handleFolderSelect,
    onToggle: toggleExpanded,
    onToggleSidebar: toggleSidebar,
    onRename: renameFolder,
    onDelete: deleteFolder,
    onCreate: createFolder,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip link para accesibilidad */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Saltar al contenido principal
      </a>

      <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Botón hamburguesa — solo visible en móvil */}
          <button
            onClick={openMobileSidebar}
            className="lg:hidden shrink-0 text-foreground-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="Abrir navegación"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            href="/dashboard"
            className="font-semibold text-foreground shrink-0"
          >
            markdown
          </Link>
          {selectedFolder && (
            <span className="hidden sm:flex min-w-0">
              <FolderBreadcrumbs
                path={selectedFolder.path}
                onNavigate={handleFolderSelect}
              />
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/settings/users"
            className="hidden sm:block text-sm text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Configuración
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop — oculto en móvil */}
        <div className="hidden lg:flex">
          <FolderSidebar {...sidebarProps} />
        </div>

        {/* Sidebar móvil — Sheet overlay */}
        <Sheet
          open={mobileSidebarOpen}
          onOpenChange={(open: boolean) => {
            if (!open) closeMobileSidebar();
          }}
        >
          <SheetContent
            side="left"
            className="p-0 w-[260px] sm:max-w-[260px] top-12 shadow-none"
            overlayClassName="top-12"
            hideClose
          >
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            <SheetDescription className="sr-only">
              Panel de navegación de carpetas
            </SheetDescription>
            <FolderSidebar
              {...sidebarProps}
              collapsed={false}
              onToggleSidebar={closeMobileSidebar}
              onDocumentSelect={closeMobileSidebar}
              asideClassName="w-full h-full border-r-0"
            />
          </SheetContent>
        </Sheet>

        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
