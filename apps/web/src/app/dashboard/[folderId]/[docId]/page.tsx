'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFolderViewModel } from '@/modules/folders/infrastructure/hooks/use-folder.viewmodel';
import { useDocumentViewModel } from '@/modules/documents/infrastructure/hooks/use-document.viewmodel';
import { PermissionLevel } from '@/modules/permissions/domain/types/permission-level.enum';
import { DocumentEditor } from '@/modules/documents/infrastructure/components/DocumentEditor';

export default function DocumentPage() {
  const params = useParams();
  const folderId = params.folderId as string;
  const docId = params.docId as string;

  const { selectFolder } = useFolderViewModel();
  const {
    currentDocument,
    saveStatus,
    isLoading,
    error,
    loadDocument,
    saveContent,
    setCurrentDocument,
  } = useDocumentViewModel();

  useEffect(() => {
    setCurrentDocument(null);
    selectFolder(folderId);
    loadDocument(docId);
  }, [folderId, docId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: 'calc(100vh - 48px)' }}
      >
        <p className="text-sm text-foreground-secondary">{error}</p>
      </div>
    );
  }

  if (isLoading || !currentDocument) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: 'calc(100vh - 48px)' }}
      >
        <span className="text-sm text-foreground-secondary">Cargando...</span>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 48px)' }}>
      <DocumentEditor
        document={currentDocument}
        saveStatus={saveStatus}
        readOnly={currentDocument.permissionLevel === PermissionLevel.VIEW}
        onSave={saveContent}
      />
    </div>
  );
}
