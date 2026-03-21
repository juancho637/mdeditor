'use client';

import { useRouter } from 'next/navigation';
import { useAuthViewModel } from '@/modules/auth/infrastructure/hooks/use-auth.viewmodel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuthViewModel();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/sign-in');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">markdown</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            Salir
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
