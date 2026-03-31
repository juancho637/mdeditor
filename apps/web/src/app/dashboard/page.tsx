'use client';

export default function DashboardPage() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: 'calc(100vh - 48px)' }}
    >
      <div className="text-center">
        <p className="text-4xl mb-2">📄</p>
        <h2 className="text-lg font-medium mb-1">Bienvenido a markdown</h2>
        <p className="text-sm text-foreground-secondary">
          Selecciona o crea una carpeta en el sidebar para empezar.
        </p>
      </div>
    </div>
  );
}
