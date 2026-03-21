'use client';

import { EmptyState } from '@/common/components/EmptyState';

export default function DashboardPage() {
  const handleCreateFolder = () => {
    // TODO: Implement folder creation in a future story
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 48px)' }}>
      <EmptyState variant="workspace" onAction={handleCreateFolder} />
    </div>
  );
}
