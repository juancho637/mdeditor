import { test, expect } from '@playwright/test';
import { resetUsers, postSetup } from './helpers/api';

const API_URL = 'http://localhost:3000';

async function getAdminToken(): Promise<string> {
  const res = await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
  const json = await res.json();
  return json.data.access_token;
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function createFolder(token: string, name: string, parentId?: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/folders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, parent_id: parentId }),
  });
  const json = await res.json();
  return json.data.id;
}

async function resetDocuments(): Promise<void> {
  const { execSync } = await import('child_process');
  execSync(
    `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "DELETE FROM documents; DELETE FROM folders;"`,
    { cwd: process.cwd(), stdio: 'pipe' },
  );
}

test.describe('Story 2-2: Creación y Edición de Documentos', () => {
  // ─── UI Tests FIRST ──────────────────────────────────────────

  test.describe('UI: Document Management', () => {
    test.beforeEach(async () => {
      await resetDocuments();
      await resetUsers();
    });

    test('AC#1+#2: Create document, edit with autosave, see save badge', async ({ page }) => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Producto');

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Select folder
      await page.getByText('Producto').click();

      // Create document
      await page.getByRole('button', { name: 'Nuevo documento' }).click();
      await page.locator('input[placeholder="Título del documento"]').fill('Brief');
      await page.getByRole('button', { name: 'Crear' }).click();

      // Document editor should open with title
      await expect(page.getByText('Brief')).toBeVisible({ timeout: 5_000 });

      // Type content — autosave should trigger
      await page.locator('textarea').fill('# Hello World');

      // Wait for autosave — check for saved state (Guardando... may flash too fast)
      await expect(page.getByText('✓ Guardado')).toBeVisible({ timeout: 10_000 });
    });
  });

  // ─── API Tests ───────────────────────────────────────────────

  test.describe('API: Document CRUD', () => {
    test.beforeEach(async () => {
      await resetDocuments();
      await resetUsers();
    });

    test('POST /api/documents creates document in folder', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');

      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'Brief', folder_id: folderId }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.title).toBe('Brief');
      expect(json.data.slug).toBe('brief');
      expect(json.data.folder_id).toBe(folderId);
      expect(json.data.content_markdown).toBe('');
    });

    test('GET /api/documents/:id returns document with content', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');

      const createRes = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'Brief', folder_id: folderId }),
      });
      const createJson = await createRes.json();

      const res = await fetch(`${API_URL}/api/documents/${createJson.data.id}`, {
        headers: authHeaders(token),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.title).toBe('Brief');
      expect(json.data.content_markdown).toBeDefined();
    });

    test('PUT /api/documents/:id updates content', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');

      const createRes = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'Brief', folder_id: folderId }),
      });
      const createJson = await createRes.json();

      const res = await fetch(`${API_URL}/api/documents/${createJson.data.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ content_markdown: '# Hello World' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.content_markdown).toBe('# Hello World');
    });

    test('PUT /api/documents/:id updates title and slug', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');

      const createRes = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'Old Title', folder_id: folderId }),
      });
      const createJson = await createRes.json();

      const res = await fetch(`${API_URL}/api/documents/${createJson.data.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'New Title' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.title).toBe('New Title');
      expect(json.data.slug).toBe('new-title');
    });

    test('DELETE /api/documents/:id deletes document', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');

      const createRes = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'ToDelete', folder_id: folderId }),
      });
      const createJson = await createRes.json();

      const res = await fetch(`${API_URL}/api/documents/${createJson.data.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });

      expect(res.status).toBe(200);

      // Verify deleted
      const getRes = await fetch(`${API_URL}/api/documents/${createJson.data.id}`, {
        headers: authHeaders(token),
      });
      expect(getRes.status).toBe(404);
    });

    test('GET /api/folders/:folderId/documents lists documents without content', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');

      await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'Doc 1', folder_id: folderId }),
      });
      await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'Doc 2', folder_id: folderId }),
      });

      const res = await fetch(`${API_URL}/api/folders/${folderId}/documents`, {
        headers: authHeaders(token),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBe(2);
      // Summary should NOT include content_markdown
      expect(json.data[0].content_markdown).toBeUndefined();
    });

    test('DELETE folder cascades to documents', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');

      const createRes = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'Orphan', folder_id: folderId }),
      });
      const createJson = await createRes.json();

      // Delete folder
      await fetch(`${API_URL}/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });

      // Document should be gone
      const getRes = await fetch(`${API_URL}/api/documents/${createJson.data.id}`, {
        headers: authHeaders(token),
      });
      expect(getRes.status).toBe(404);
    });

    test('POST /api/documents without auth returns 401', async () => {
      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', folder_id: 'fake' }),
      });
      expect(res.status).toBe(401);
    });
  });
});
