'use client';

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface FolderBreadcrumbsProps {
  path: BreadcrumbItem[];
  onNavigate: (id: string) => void;
}

export function FolderBreadcrumbs({ path, onNavigate }: FolderBreadcrumbsProps) {
  if (path.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-foreground-secondary">
      {path.map((item, index) => (
        <span key={item.id} className="flex items-center gap-1">
          {index > 0 && <span className="text-border">/</span>}
          <button
            onClick={() => onNavigate(item.id)}
            className="hover:text-foreground transition-colors"
          >
            {item.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
