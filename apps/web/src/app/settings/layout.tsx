'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthViewModel } from '@/modules/auth/infrastructure/hooks/use-auth.viewmodel';
import { ThemeToggle } from '@/modules/theme/infrastructure/components/ThemeToggle';
import { useThemeStore } from '@/modules/theme/infrastructure/state/theme.state';

const settingsLinks = [
  { href: '/settings/users', label: 'Usuarios' },
  { href: '/settings/groups', label: 'Grupos' },
  { href: '/settings/permissions', label: 'Permisos' },
  { href: '/settings/api-keys', label: 'API Keys' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthViewModel();
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const handleLogout = async () => {
    await logout();
    router.push('/sign-in');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Saltar al contenido principal
      </a>

      <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
        <Link
          href="/dashboard"
          className="font-semibold text-foreground shrink-0"
        >
          markdown
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/settings/users"
            className="hidden sm:block text-sm text-primary font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
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

      <main id="main-content" className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-xl font-semibold mb-6">Configuración</h1>
          <div className="flex gap-6">
            <nav className="w-48 shrink-0">
              <ul className="space-y-1">
                {settingsLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        pathname === link.href
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground-secondary hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
