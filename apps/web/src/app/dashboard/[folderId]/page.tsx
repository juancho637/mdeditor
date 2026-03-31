'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFolderViewModel } from '@/modules/folders/infrastructure/hooks/use-folder.viewmodel';
import { useDocumentViewModel } from '@/modules/documents/infrastructure/hooks/use-document.viewmodel';
import { Button } from '@/common/components/ui/button';
import { useSwipeLeft } from '@/common/hooks/use-swipe-left';
import type { DocumentSummary } from '@/modules/documents/domain/types/document-summary.type';

interface DocumentRowProps {
  doc: DocumentSummary;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

function DocumentRow({ doc, onOpen, onDelete }: DocumentRowProps) {
  const { isSwiped, reset, handlers } = useSwipeLeft();

  return (
    <div className="relative flex items-center overflow-hidden" {...handlers}>
      <div
        className={`flex items-center justify-between px-4 py-3 hover:bg-muted w-full transition-transform duration-200 ${isSwiped ? '-translate-x-16' : 'translate-x-0'}`}
      >
        <button
          className="text-left flex-1"
          onClick={() => {
            reset();
            onOpen(doc.id);
          }}
        >
          <p className="text-sm font-medium">📄 {doc.title}</p>
          <p className="text-xs text-foreground-secondary">
            {new Date(doc.updatedAt).toLocaleDateString('es')}
          </p>
        </button>
        <button
          className="hidden md:block text-xs text-destructive hover:text-destructive px-2"
          onClick={() => onDelete(doc.id)}
        >
          Eliminar
        </button>
      </div>
      {/* Swipe-to-delete action — mobile only */}
      <button
        className={`absolute right-0 h-full w-16 bg-destructive text-white text-xs font-medium flex items-center justify-center transition-opacity duration-200 ${isSwiped ? 'opacity-100' : 'invisible pointer-events-none'}`}
        onClick={() => onDelete(doc.id)}
        aria-label={`Eliminar ${doc.title}`}
        aria-hidden={!isSwiped}
        tabIndex={isSwiped ? 0 : -1}
        data-testid={`delete-swipe-${doc.id}`}
      >
        Eliminar
      </button>
    </div>
  );
}

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const { selectFolder, selectedFolder, loadTree } = useFolderViewModel();
  const {
    folderDocuments,
    isLoading,
    loadFolderDocuments,
    createDocument,
    deleteDocument,
    importDocuments,
  } = useDocumentViewModel();

  const [creatingDoc, setCreatingDoc] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectFolder(folderId);
    loadFolderDocuments(folderId);
  }, [folderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenDocument = (docId: string) => {
    router.push(`/dashboard/${folderId}/${docId}`);
  };

  return (
    <div className="p-4 sm:p-6" style={{ minHeight: 'calc(100vh - 48px)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-medium">{selectedFolder?.name ?? '...'}</h2>
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".md"
            multiple
            className="hidden"
            data-testid="import-file-input"
            onChange={async (e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                await importDocuments(folderId, Array.from(files));
                await loadFolderDocuments(folderId);
              }
              if (importInputRef.current) importInputRef.current.value = '';
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => importInputRef.current?.click()}
            style={{ borderRadius: 'var(--radius-btn)' }}
            data-testid="import-documents-btn"
          >
            Importar .md
          </Button>
          <Button
            size="sm"
            onClick={() => setCreatingDoc(true)}
            style={{ borderRadius: 'var(--radius-btn)' }}
          >
            Nuevo documento
          </Button>
        </div>
      </div>

      {creatingDoc && (
        <form
          className="flex gap-2 mb-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (newTitle.trim()) {
              const doc = await createDocument(newTitle.trim(), folderId);
              await loadTree();
              setNewTitle('');
              setCreatingDoc(false);
              if (doc?.id) router.push(`/dashboard/${folderId}/${doc.id}`);
            }
          }}
        >
          <input
            className="flex-1 text-sm bg-background border border-border rounded px-3 py-1.5"
            placeholder="Título del documento"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') setCreatingDoc(false);
            }}
          />
          <Button type="submit" size="sm" disabled={isLoading}>
            Crear
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreatingDoc(false)}
          >
            Cancelar
          </Button>
        </form>
      )}

      {folderDocuments.length > 0 ? (
        <div className="border border-border rounded-md divide-y divide-border">
          {folderDocuments.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              onOpen={handleOpenDocument}
              onDelete={(id) => deleteDocument(id, folderId)}
            />
          ))}
        </div>
      ) : !creatingDoc ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">📁</p>
          <p className="text-sm text-foreground-secondary">
            Esta carpeta está vacía. Crea un nuevo documento para empezar.
          </p>
        </div>
      ) : null}
    </div>
  );
}
