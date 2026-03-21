'use client';

import { RegisterForm } from '@/modules/auth/infrastructure/components/RegisterForm';

export default function SetupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">markdown</h1>
          <p className="text-foreground-secondary mt-2">
            Tu espacio de trabajo para notas y documentos
          </p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
