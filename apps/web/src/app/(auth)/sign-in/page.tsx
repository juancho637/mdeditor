'use client';

import { SignInForm } from '@/modules/auth/infrastructure/components/SignInForm';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">markdown</h1>
          <p className="text-foreground-secondary mt-2">
            Inicia sesión para continuar
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
