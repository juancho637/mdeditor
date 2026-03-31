import { test, expect } from '@playwright/test';
import {
  API_URL,
  resetAndSeedUsers,
  createFolder,
  createDocument,
  setFolderPermission,
  querySQL,
} from './helpers/api';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
) {
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL('/dashboard');
}

async function createShare(token: string, documentId: string) {
  const res = await fetch(`${API_URL}/api/documents/${documentId}/share`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return res;
}

async function getShare(token: string, documentId: string) {
  const res = await fetch(`${API_URL}/api/documents/${documentId}/share`, {
    headers: authHeaders(token),
  });
  return res;
}

async function deleteShare(token: string, documentId: string) {
  const res = await fetch(`${API_URL}/api/documents/${documentId}/share`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return res;
}

async function getPublicDocument(token: string) {
  return fetch(`${API_URL}/api/public/documents/${token}`);
}

// ─────────────────────────────────────────────────────────────────
// Story 8-4: Compartir Documento Público
// ─────────────────────────────────────────────────────────────────

test.describe('Story 8-4: Compartir Documento Público', () => {
  // ─── API: Crear share token ───────────────────────────────────
  test.describe('API: Crear share token', () => {
    test('AC#1: POST /api/documents/:id/share crea un share token único', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share');
      const docId = await createDocument(
        adminToken,
        'Doc Compartido',
        folderId,
      );

      const res = await createShare(adminToken, docId);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data).toMatchObject({
        share_token: expect.any(String),
        document_id: docId,
        share_url: expect.stringContaining('/p/'),
      });
      expect(json.data.share_token).toHaveLength(64);
    });

    test('AC#1: POST es idempotente — mismo token si ya existe share', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share');
      const docId = await createDocument(
        adminToken,
        'Doc Compartido',
        folderId,
      );

      const res1 = await createShare(adminToken, docId);
      const json1 = await res1.json();

      const res2 = await createShare(adminToken, docId);
      const json2 = await res2.json();

      expect(json1.data.share_token).toBe(json2.data.share_token);
    });

    test('AC#6: usuario sin permiso edit no puede crear share (403)', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Restringida');
      const docId = await createDocument(
        adminToken,
        'Doc Restringido',
        folderId,
      );

      // user2 tiene grupo Editors pero sin permiso asignado en esta carpeta → 403
      const user2Token = await (async () => {
        const res = await fetch(`${API_URL}/api/auth/sign-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'user2@test.com',
            password: 'password123',
          }),
        });
        const json = await res.json();
        return json.data.access_token as string;
      })();

      const res = await createShare(user2Token, docId);
      expect(res.status).toBe(403);
    });
  });

  // ─── API: Obtener share ───────────────────────────────────────
  test.describe('API: Obtener share activo', () => {
    test('AC#2: GET /api/documents/:id/share retorna el share activo', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share');
      const docId = await createDocument(
        adminToken,
        'Doc Compartido',
        folderId,
      );

      await createShare(adminToken, docId);
      const res = await getShare(adminToken, docId);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.share_token).toHaveLength(64);
    });

    test('AC#2: GET retorna 404 si no hay share activo', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share');
      const docId = await createDocument(adminToken, 'Doc Sin Share', folderId);

      const res = await getShare(adminToken, docId);
      expect(res.status).toBe(404);
    });
  });

  // ─── API: Revocar share ───────────────────────────────────────
  test.describe('API: Revocar share', () => {
    test('AC#3: DELETE /api/documents/:id/share revoca el share (204)', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share');
      const docId = await createDocument(
        adminToken,
        'Doc Compartido',
        folderId,
      );

      const createRes = await createShare(adminToken, docId);
      const { data } = await createRes.json();
      const token = data.share_token;

      const deleteRes = await deleteShare(adminToken, docId);
      expect(deleteRes.status).toBe(204);

      // Verificar que el token ya no funciona
      const publicRes = await getPublicDocument(token);
      expect(publicRes.status).toBe(404);
    });
  });

  // ─── API: Endpoint público ────────────────────────────────────
  test.describe('API: Documento público por token', () => {
    test('AC#4: GET /api/public/documents/:token sin auth retorna documento', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share');
      const docId = await createDocument(adminToken, 'Doc Público', folderId);

      // Agregar contenido
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: authHeaders(adminToken),
        body: JSON.stringify({
          content_markdown: '# Hola mundo\n\nContenido público.',
        }),
      });

      const createRes = await createShare(adminToken, docId);
      const { data } = await createRes.json();

      // Acceso sin auth
      const publicRes = await getPublicDocument(data.share_token);
      expect(publicRes.status).toBe(200);

      const json = await publicRes.json();
      const doc = json.data ?? json;
      expect(doc.title).toBe('Doc Público');
      expect(doc.content_markdown).toContain('Hola mundo');
      expect(doc).not.toHaveProperty('id');
      expect(doc).toHaveProperty('folder_id');
      expect(doc).not.toHaveProperty('yjs_state');
    });

    test('AC#5: GET /api/public/documents/:token con token inválido retorna 404', async () => {
      const res = await getPublicDocument(
        'token-que-no-existe-0000000000000000',
      );
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.code_error).toBe('DOC004');
    });

    test('AC#5: token revocado retorna 404', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share');
      const docId = await createDocument(adminToken, 'Doc Revocado', folderId);

      const createRes = await createShare(adminToken, docId);
      const { data } = await createRes.json();
      const token = data.share_token;

      await deleteShare(adminToken, docId);

      const publicRes = await getPublicDocument(token);
      expect(publicRes.status).toBe(404);
    });

    test('AC#7: cascade delete — eliminar documento invalida el share', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share');
      const docId = await createDocument(
        adminToken,
        'Doc a Eliminar',
        folderId,
      );

      const createRes = await createShare(adminToken, docId);
      const { data } = await createRes.json();
      const token = data.share_token;

      // Eliminar el documento
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: authHeaders(adminToken),
      });

      // El token debe ser inválido
      const publicRes = await getPublicDocument(token);
      expect(publicRes.status).toBe(404);
    });
  });

  // ─── UI: Panel de compartir ───────────────────────────────────
  test.describe('UI: Panel de compartir', () => {
    test('AC#1: botón Compartir visible para usuario con permiso edit', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share');
      await createDocument(adminToken, 'Doc Edit', folderId);

      await loginAs(page, 'admin@test.com', 'password123');

      // Navegar al documento
      await page.getByText('Carpeta Share').click();
      await page.getByText('Doc Edit').click();
      await page.waitForSelector('[data-testid="share-document-btn"]');

      await expect(page.getByTestId('share-document-btn')).toBeVisible();
    });

    test('AC#6: botón Compartir NO visible para usuario con permiso view', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta View');
      await createDocument(adminToken, 'Doc Solo Lectura', folderId);

      // Asignar permiso view a user2
      const groupId = querySQL(
        "SELECT id FROM groups WHERE name='Editors' LIMIT 1;",
      );
      await setFolderPermission(adminToken, folderId, groupId, 'view');

      await loginAs(page, 'user2@test.com', 'password123');
      await page.getByText('Carpeta View').click();
      await page.getByText('Doc Solo Lectura').click();

      // En modo read-only no debe aparecer el botón compartir
      await expect(page.getByTestId('share-document-btn')).not.toBeVisible();
    });

    test('AC#1: clic en Compartir abre SharePanel y genera link automáticamente', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share UI');
      await createDocument(adminToken, 'Doc Compartir UI', folderId);

      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByText('Carpeta Share UI').click();
      await page.getByText('Doc Compartir UI').click();
      await page.waitForSelector('[data-testid="share-document-btn"]');

      await page.getByTestId('share-document-btn').click();
      await expect(page.getByTestId('share-panel')).toBeVisible();

      // Link se genera automáticamente — no requiere clic adicional
      await expect(page.getByTestId('share-url-input')).toBeVisible();

      const shareUrl = await page.getByTestId('share-url-input').inputValue();
      expect(shareUrl).toContain('/p/');
    });

    test('AC#2: abrir panel segunda vez muestra mismo link (idempotente)', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share UI');
      await createDocument(adminToken, 'Doc Idempotente', folderId);

      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByText('Carpeta Share UI').click();
      await page.getByText('Doc Idempotente').click();
      await page.waitForSelector('[data-testid="share-document-btn"]');

      // Primera apertura — share se genera automáticamente
      await page.getByTestId('share-document-btn').click();
      await expect(page.getByTestId('share-url-input')).toBeVisible();
      const url1 = await page.getByTestId('share-url-input').inputValue();

      // Cerrar y reabrir
      await page.keyboard.press('Escape');
      await page.getByTestId('share-document-btn').click();
      await expect(page.getByTestId('share-url-input')).toBeVisible();
      const url2 = await page.getByTestId('share-url-input').inputValue();

      expect(url1).toBe(url2);
    });

    test('AC#3: revocar share muestra opción de generar nuevo link', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Share UI');
      await createDocument(adminToken, 'Doc Revocar UI', folderId);

      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByText('Carpeta Share UI').click();
      await page.getByText('Doc Revocar UI').click();
      await page.waitForSelector('[data-testid="share-document-btn"]');

      // Abrir panel — share se genera automáticamente
      await page.getByTestId('share-document-btn').click();
      await expect(page.getByTestId('share-url-input')).toBeVisible();

      // Revocar (doble clic)
      await page.getByTestId('revoke-share-btn').click(); // primer clic — pide confirmación
      await page.getByTestId('revoke-share-btn').click(); // segundo clic — confirma

      // Debe volver al estado sin share (botón para generar nuevo)
      await expect(page.getByTestId('generate-share-link-btn')).toBeVisible();
    });
  });

  // ─── UI: Página pública /p/[token] ───────────────────────────
  test.describe('UI: Página pública /p/[token]', () => {
    test('AC#4: acceso sin auth muestra documento renderizado', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Pública');
      const docId = await createDocument(
        adminToken,
        'Mi Doc Público',
        folderId,
      );

      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: authHeaders(adminToken),
        body: JSON.stringify({
          content_markdown: '# Título de prueba\n\nPárrafo de contenido.',
        }),
      });

      const createRes = await createShare(adminToken, docId);
      const { data } = await createRes.json();
      const token = data.share_token;

      // Acceder sin sesión
      await page.goto(`/p/${token}`);

      await expect(page.getByTestId('public-doc-title')).toContainText(
        'Mi Doc Público',
      );
      await expect(page.getByTestId('public-doc-content')).toContainText(
        'Título de prueba',
      );

      // No debe haber sidebar ni editor
      await expect(
        page.locator('[data-testid="share-document-btn"]'),
      ).not.toBeVisible();
    });

    test('AC#5: token inválido muestra pantalla de error', async ({ page }) => {
      await page.goto('/p/token-completamente-invalido-0000000000000');

      await expect(page.getByTestId('public-doc-not-found')).toBeVisible();
    });

    test('AC#5 Happy path completo: generar link → logout → acceder → ver doc', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Happy');
      const docId = await createDocument(
        adminToken,
        'Doc Happy Path',
        folderId,
      );

      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: authHeaders(adminToken),
        body: JSON.stringify({
          content_markdown: '# Hola desde el link público',
        }),
      });

      const createRes = await createShare(adminToken, docId);
      const { data } = await createRes.json();
      const shareUrl = data.share_url as string; // e.g. /p/abc...

      // Acceder al link sin autenticación
      await page.goto(shareUrl);

      await expect(page.getByTestId('public-doc-title')).toContainText(
        'Doc Happy Path',
      );
      await expect(page.getByTestId('public-doc-content')).toContainText(
        'Hola desde el link público',
      );

      // Header mínimo con nombre de la plataforma
      await expect(page.locator('header')).toContainText('markdown');
    });
  });
});
