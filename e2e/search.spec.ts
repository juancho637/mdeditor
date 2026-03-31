import { test, expect } from '@playwright/test';
import {
  API_URL,
  resetAndSeedUsers,
  createFolder,
  createDocument,
} from './helpers/api';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function searchDocuments(token: string, query: string) {
  const res = await fetch(
    `${API_URL}/api/documents/search?q=${encodeURIComponent(query)}`,
    { headers: authHeaders(token) },
  );
  return { status: res.status, data: (await res.json()).data };
}

async function updateDocumentContent(
  token: string,
  docId: string,
  content: string,
) {
  await fetch(`${API_URL}/api/documents/${docId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ content_markdown: content }),
  });
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

// ─────────────────────────────────────────────────────────────────
// Story 8-1: Búsqueda Global de Contenido
// ─────────────────────────────────────────────────────────────────

test.describe('Story 8-1: Búsqueda Global de Contenido', () => {
  test.describe('API: Search endpoint', () => {
    test('AC#2 + AC#4: returns documents matching query title, filtered by permissions', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Docs de Búsqueda');
      await createDocument(adminToken, 'Guía de TypeScript Avanzado', folderId);
      await createDocument(adminToken, 'Introducción a NestJS', folderId);

      // Admin sees both
      const { status, data } = await searchDocuments(adminToken, 'TypeScript');
      expect(status).toBe(200);
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThanOrEqual(1);
      const result = data.find((r: { title: string }) =>
        r.title.includes('TypeScript'),
      );
      expect(result).toBeDefined();
      expect(result.folder_id).toBe(folderId);
      expect(result.folder_name).toBe('Docs de Búsqueda');
      expect(result.title).toBe('Guía de TypeScript Avanzado');
      expect(result.slug).toBeTruthy();
      expect(result.preview).toBeDefined();
    });

    test('AC#4: user without folder permission gets no results for that folder', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Privada');
      await createDocument(adminToken, 'Documento Secreto Privado', folderId);
      // No permissions assigned to user2 for this folder

      // Small delay to avoid throttle
      await new Promise((r) => setTimeout(r, 1500));
      const user2Res = await fetch(`${API_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user2@test.com',
          password: 'password123',
        }),
      });
      const user2Json = await user2Res.json();
      const user2Token = user2Json.data?.access_token;
      expect(user2Token).toBeTruthy();

      const { data } = await searchDocuments(user2Token, 'Secreto');
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBe(0);
    });

    test('AC#4: user with VIEW permission sees documents in that folder', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Carpeta Compartida');
      await createDocument(
        adminToken,
        'Arquitectura de Microservicios',
        folderId,
      );

      // Get Editors group ID from API
      const groupsRes = await fetch(`${API_URL}/api/groups`, {
        headers: authHeaders(adminToken),
      });
      const groupsJson = await groupsRes.json();
      const editorsGroup = groupsJson.data.find(
        (g: { name: string }) => g.name === 'Editors',
      );
      const groupId = editorsGroup.id;

      const permRes = await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT',
        headers: authHeaders(adminToken),
        body: JSON.stringify({
          folder_id: folderId,
          group_id: groupId,
          permission_level: 'view',
        }),
      });
      expect(permRes.status).toBe(200);

      // Small delay to avoid throttle
      await new Promise((r) => setTimeout(r, 1500));
      const user2Res = await fetch(`${API_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user2@test.com',
          password: 'password123',
        }),
      });
      const user2Json = await user2Res.json();
      const user2Token = user2Json.data?.access_token;
      expect(user2Token).toBeTruthy();

      const { data } = await searchDocuments(user2Token, 'Microservicios');
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0].title).toBe('Arquitectura de Microservicios');
    });

    test('AC#5: returns empty array for non-matching query', async () => {
      const adminToken = await resetAndSeedUsers();
      const { status, data } = await searchDocuments(
        adminToken,
        'xyzquerynoexiste999',
      );
      expect(status).toBe(200);
      expect(data).toEqual([]);
    });

    test('AC#2: returns empty array for query shorter than 2 chars', async () => {
      const adminToken = await resetAndSeedUsers();
      const { data } = await searchDocuments(adminToken, 'a');
      expect(data).toEqual([]);
    });

    test('returns 401 for unauthenticated request', async () => {
      const res = await fetch(`${API_URL}/api/documents/search?q=test`);
      expect(res.status).toBe(401);
    });

    test('AC#2: result includes id, folder_id, folder_name, title, slug, preview fields', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Test Fields');
      const docId = await createDocument(
        adminToken,
        'Document Fields Verificacion',
        folderId,
      );
      await updateDocumentContent(
        adminToken,
        docId,
        'Contenido de ejemplo para verificar campos de búsqueda.',
      );

      const { data } = await searchDocuments(adminToken, 'verificar');
      // Results may come from content (after trigger update)
      // Also search by title
      const { data: titleData } = await searchDocuments(adminToken, 'Fields');
      expect(titleData.length).toBeGreaterThanOrEqual(1);
      const result = titleData[0];
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('folder_id');
      expect(result).toHaveProperty('folder_name');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('preview');
    });
  });

  test.describe('UI: Command Palette', () => {
    test('AC#1: Cmd/Ctrl+K opens command palette with focused input', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'Test Folder');

      await loginAs(page, 'admin@test.com', 'password123');

      // Open with keyboard shortcut
      await page.keyboard.press('Control+k');
      await expect(page.locator('[cmdk-input]')).toBeVisible();
      await expect(page.locator('[cmdk-input]')).toBeFocused();
    });

    test('AC#6: sidebar search button opens same command palette', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'Test Sidebar Search');

      await loginAs(page, 'admin@test.com', 'password123');

      // Click sidebar search button
      await page.locator('button[title*="Buscar"]').click();
      await expect(page.locator('[cmdk-input]')).toBeVisible();
    });

    test('AC#1: pressing Escape closes command palette', async ({ page }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'Test Escape');

      await loginAs(page, 'admin@test.com', 'password123');

      await page.keyboard.press('Control+k');
      await expect(page.locator('[cmdk-input]')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.locator('[cmdk-input]')).not.toBeVisible();
    });

    test('AC#1: clicking backdrop closes command palette', async ({ page }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'Test Backdrop');

      await loginAs(page, 'admin@test.com', 'password123');

      await page.keyboard.press('Control+k');
      await expect(page.locator('[cmdk-input]')).toBeVisible();

      // Click on the overlay backdrop (outside the palette)
      await page
        .locator('.fixed.inset-0')
        .click({ position: { x: 10, y: 10 } });
      await expect(page.locator('[cmdk-input]')).not.toBeVisible();
    });

    test('AC#2: typing a search term shows results with title, folder, preview', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'MiCarpeta');
      await createDocument(adminToken, 'GuiaPlaywright E2E', folderId);

      await loginAs(page, 'admin@test.com', 'password123');

      await page.keyboard.press('Control+k');
      await page.locator('[cmdk-input]').fill('GuiaPlaywright');

      // Wait for debounce + results
      await expect(page.locator('[cmdk-item]').first()).toBeVisible({
        timeout: 2000,
      });
      const item = page.locator('[cmdk-item]').first();
      await expect(item).toContainText('GuiaPlaywright');
      await expect(item).toContainText('MiCarpeta');
    });

    test('AC#5: no results shows empty state message', async ({ page }) => {
      const adminToken = await resetAndSeedUsers();
      await loginAs(page, 'admin@test.com', 'password123');

      await page.keyboard.press('Control+k');
      await page.locator('[cmdk-input]').fill('xyzquerynoexiste999abc');

      await expect(page.getByText(/No se encontraron documentos/)).toBeVisible({
        timeout: 2000,
      });
      await expect(page.getByText('Limpiar búsqueda')).toBeVisible();
    });

    test('AC#3: selecting result navigates to document', async ({ page }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'NavFolder');
      await createDocument(adminToken, 'DocumentoNavegacion', folderId);

      await loginAs(page, 'admin@test.com', 'password123');

      await page.keyboard.press('Control+k');
      await page.locator('[cmdk-input]').fill('DocumentoNavegacion');

      await expect(page.locator('[cmdk-item]').first()).toBeVisible({
        timeout: 2000,
      });
      await page.locator('[cmdk-item]').first().click();

      // Palette closes and document editor opens
      await expect(page.locator('[cmdk-input]')).not.toBeVisible();
      // Editor or document content should be visible
      await expect(
        page.locator('.cm-editor, [data-testid="document-editor"]').first(),
      ).toBeVisible({ timeout: 3000 });
    });
  });
});
