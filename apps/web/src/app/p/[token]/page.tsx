'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { SignInForm } from '@/modules/auth/infrastructure/components/SignInForm';
import { getAccessToken } from '@/common/helpers/token-storage.utils';

type PageState = 'loading' | 'loaded' | 'not-found';

interface PublicDoc {
  documentId: string;
  folderId: string;
  title: string;
  contentMarkdown: string;
}

export default function PublicDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [state, setState] = useState<PageState>('loading');
  const [doc, setDoc] = useState<PublicDoc | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(`${baseUrl}/api/public/documents/${token}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        setDoc({
          documentId: data.data?.document_id ?? data.document_id,
          folderId: data.data?.folder_id ?? data.folder_id,
          title: data.data?.title ?? data.title,
          contentMarkdown: data.data?.content_markdown ?? data.content_markdown,
        });
        setState('loaded');
      })
      .catch(() => setState('not-found'));
  }, [token]);

  useEffect(() => {
    if (
      state === 'loaded' &&
      doc?.documentId &&
      doc?.folderId &&
      getAccessToken()
    ) {
      router.replace(`/dashboard/${doc.folderId}/${doc.documentId}`);
    }
  }, [state, doc, router]);

  const isAuthenticated = !!getAccessToken();
  const dashboardUrl =
    doc?.folderId && doc?.documentId
      ? `/dashboard/${doc.folderId}/${doc.documentId}`
      : '/dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-sm">markdown</span>
        {state === 'loaded' && !isAuthenticated && (
          <button
            className="text-sm font-medium text-foreground hover:opacity-70 transition-opacity"
            onClick={() => setShowLogin((v) => !v)}
          >
            {showLogin ? 'Cancelar' : 'Iniciar sesión'}
          </button>
        )}
      </header>

      {showLogin && doc && (
        <div className="border-b border-border bg-muted/40 px-6 py-6 flex justify-center">
          <div className="w-full max-w-md">
            <SignInForm redirectTo={dashboardUrl} />
          </div>
        </div>
      )}

      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-8">
        {state === 'loading' && (
          <div className="flex items-center justify-center py-24">
            <span className="text-sm text-foreground-secondary">
              Cargando...
            </span>
          </div>
        )}

        {state === 'not-found' && (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4"
            data-testid="public-doc-not-found"
          >
            <p className="text-4xl">📄</p>
            <h1 className="text-xl font-semibold">Documento no encontrado</h1>
            <p className="text-sm text-foreground-secondary text-center">
              El link que visitaste no es válido o el acceso fue revocado.
            </p>
          </div>
        )}

        {state === 'loaded' && doc && (
          <>
            <h1
              className="text-2xl font-bold mb-6"
              data-testid="public-doc-title"
            >
              {doc.title}
            </h1>
            <article className="prose" data-testid="public-doc-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                skipHtml
              >
                {doc.contentMarkdown}
              </ReactMarkdown>
            </article>
          </>
        )}
      </main>
    </div>
  );
}
