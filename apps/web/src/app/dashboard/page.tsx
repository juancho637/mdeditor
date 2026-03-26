'use client';

import { useEffect, useState } from 'react';
import { useFolderViewModel } from '@/modules/folders/infrastructure/hooks/use-folder.viewmodel';
import { useDocumentViewModel } from '@/modules/documents/infrastructure/hooks/use-document.viewmodel';
import { DocumentEditor } from '@/modules/documents/infrastructure/components/DocumentEditor';
import { Button } from '@/common/components/ui/button';

export default function DashboardPage() {
  const { selectedFolder, loadTree } = useFolderViewModel();
  const {
    currentDocument, folderDocuments, saveStatus,
    loadDocument, loadFolderDocuments, createDocument, saveContent, deleteDocument,
  } = useDocumentViewModel();

  const [creatingDoc, setCreatingDoc] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (selectedFolder) {
      loadFolderDocuments(selectedFolder.id);
    }
  }, [selectedFolder, loadFolderDocuments]);

  if (currentDocument) {
    return (
      <div className="h-full" style={{ minHeight: 'calc(100vh - 48px)' }}>
        <DocumentEditor
          document={currentDocument}
          saveStatus={saveStatus}
          onSave={saveContent}
        />
      </div>
    );
  }

  if (selectedFolder) {
    return (
      <div className="p-6" style={{ minHeight: 'calc(100vh - 48px)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">{selectedFolder.name}</h2>
          <Button
            size="sm"
            onClick={() => setCreatingDoc(true)}
            style={{ borderRadius: 'var(--radius-btn)' }}
          >
            Nuevo documento
          </Button>
        </div>

        {creatingDoc && (
          <form
            className="flex gap-2 mb-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (newTitle.trim()) {
                await createDocument(newTitle.trim(), selectedFolder.id);
                await loadTree();
                setNewTitle('');
                setCreatingDoc(false);
              }
            }}
          >
            <input
              className="flex-1 text-sm bg-background border border-border rounded px-3 py-1.5"
              placeholder="Título del documento"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Escape') setCreatingDoc(false); }}
            />
            <Button type="submit" size="sm">Crear</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setCreatingDoc(false)}>
              Cancelar
            </Button>
          </form>
        )}

        {folderDocuments.length > 0 ? (
          <div className="border border-border rounded-md divide-y divide-border">
            {folderDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted"
              >
                <button
                  className="text-left flex-1"
                  onClick={() => loadDocument(doc.id)}
                >
                  <p className="text-sm font-medium">📄 {doc.title}</p>
                  <p className="text-xs text-foreground-secondary">
                    {new Date(doc.updatedAt).toLocaleDateString('es')}
                  </p>
                </button>
                <button
                  className="text-xs text-destructive hover:text-destructive px-2"
                  onClick={() => deleteDocument(doc.id, selectedFolder.id)}
                >
                  Eliminar
                </button>
              </div>
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

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 48px)' }}>
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
