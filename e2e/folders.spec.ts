import { test, expect } from '@playwright/test';
import { resetUsers, postSetup, postSignIn } from './helpers/api';

const API_URL = 'http://localhost:3000';

async function getAdminToken(): Promise<string> {
  const setupRes = await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
  const json = await setupRes.json();
  return json.data.access_token;
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function resetFolders(): Promise<void> {
  const { execSync } = await import('child_process');
  execSync(
    `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "DELETE FROM folders;"`,
    { cwd: process.cwd(), stdio: 'pipe' },
  );
}

test.describe('Story 2-1: Estructura de Carpetas y Sidebar', () => {
  // ─── UI Tests FIRST ──────────────────────────────────────────

  test.describe('UI: Folder Management', () => {
    test.beforeEach(async () => {
      await resetFolders();
      await resetUsers();
    });

    test('AC#1: Create folder from sidebar and see it in tree', async ({ page }) => {
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Click + to create folder
      await page.getByTitle('Nueva carpeta').click();
      await page.locator('input[placeholder="Nombre de carpeta"]').fill('Marketing');
      await page.locator('input[placeholder="Nombre de carpeta"]').press('Enter');

      await expect(page.getByText('Marketing')).toBeVisible({ timeout: 5_000 });
    });

    test('AC#7: Sidebar collapse hides sidebar', async ({ page }) => {
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Sidebar should be visible (260px)
      await expect(page.locator('aside')).toBeVisible();

      // Collapse
      await page.getByTitle('Colapsar sidebar').click();

      // Sidebar should be narrow (collapsed)
      const aside = page.locator('aside');
      await expect(aside).not.toBeVisible();
    });
  });

  // ─── API Tests ───────────────────────────────────────────────

  test.describe('API: Folder CRUD', () => {
    test.beforeEach(async () => {
      await resetFolders();
      await resetUsers();
    });

    test('POST /api/folders creates root folder', async () => {
      const token = await getAdminToken();

      const res = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Marketing' }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.name).toBe('Marketing');
      expect(json.data.slug).toBe('marketing');
      expect(json.data.parent_id).toBeNull();
    });

    test('POST /api/folders creates subfolder', async () => {
      const token = await getAdminToken();

      const parentRes = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Root' }),
      });
      const parentJson = await parentRes.json();

      const res = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Sub', parent_id: parentJson.data.id }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.parent_id).toBe(parentJson.data.id);
    });

    test('POST /api/folders with duplicate name in same parent returns FLD002', async () => {
      const token = await getAdminToken();

      await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Marketing' }),
      });

      const res = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Marketing' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code_error).toBe('FLD002');
    });

    test('GET /api/folders/tree returns hierarchical tree', async () => {
      const token = await getAdminToken();

      const rootRes = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Root' }),
      });
      const rootJson = await rootRes.json();

      await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Child', parent_id: rootJson.data.id }),
      });

      const res = await fetch(`${API_URL}/api/folders/tree`, {
        headers: authHeaders(token),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBe(1);
      expect(json.data[0].name).toBe('Root');
      expect(json.data[0].children.length).toBe(1);
      expect(json.data[0].children[0].name).toBe('Child');
    });

    test('GET /api/folders/:id returns folder with path', async () => {
      const token = await getAdminToken();

      const rootRes = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Root' }),
      });
      const rootJson = await rootRes.json();

      const childRes = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Child', parent_id: rootJson.data.id }),
      });
      const childJson = await childRes.json();

      const res = await fetch(`${API_URL}/api/folders/${childJson.data.id}`, {
        headers: authHeaders(token),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('Child');
      expect(json.data.path.length).toBe(2);
      expect(json.data.path[0].name).toBe('Root');
      expect(json.data.path[1].name).toBe('Child');
    });

    test('PUT /api/folders/:id renames folder', async () => {
      const token = await getAdminToken();

      const createRes = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Old Name' }),
      });
      const createJson = await createRes.json();

      const res = await fetch(`${API_URL}/api/folders/${createJson.data.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'New Name' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('New Name');
      expect(json.data.slug).toBe('new-name');
    });

    test('DELETE /api/folders/:id deletes folder', async () => {
      const token = await getAdminToken();

      const createRes = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'ToDelete' }),
      });
      const createJson = await createRes.json();

      const res = await fetch(`${API_URL}/api/folders/${createJson.data.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });

      expect(res.status).toBe(200);

      const treeRes = await fetch(`${API_URL}/api/folders/tree`, { headers: authHeaders(token) });
      const treeJson = await treeRes.json();
      expect(treeJson.data.length).toBe(0);
    });

    test('DELETE /api/folders/:id cascades to children', async () => {
      const token = await getAdminToken();

      const parentRes = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Parent' }),
      });
      const parentJson = await parentRes.json();

      await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Child', parent_id: parentJson.data.id }),
      });

      await fetch(`${API_URL}/api/folders/${parentJson.data.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });

      const treeRes = await fetch(`${API_URL}/api/folders/tree`, { headers: authHeaders(token) });
      const treeJson = await treeRes.json();
      expect(treeJson.data.length).toBe(0);
    });

    test('POST /api/folders without auth returns 401', async () => {
      const res = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });
      expect(res.status).toBe(401);
    });
  });
});
