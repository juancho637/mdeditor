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

async function createFolder(token: string, name: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/folders`, {
    method: 'POST', headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  return json.data.id;
}

async function createGroup(token: string, name: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/groups`, {
    method: 'POST', headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  return json.data.id;
}

async function resetAll(): Promise<void> {
  const { execSync } = await import('child_process');
  execSync(
    `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "DELETE FROM folder_permissions; DELETE FROM documents; DELETE FROM folders; DELETE FROM user_groups; DELETE FROM groups;"`,
    { cwd: process.cwd(), stdio: 'pipe' },
  );
}

test.describe('Story 3-1: Asignación de Permisos por Carpeta', () => {
  // ─── UI Tests FIRST ──────────────────────────────────────────

  test.describe('UI: Permission Matrix', () => {
    test.beforeEach(async () => {
      await resetAll();
      await resetUsers();
    });

    test('AC#1: Admin sees permission matrix with folders and groups', async ({ page }) => {
      const token = await getAdminToken();
      await createFolder(token, 'Marketing');
      await createGroup(token, 'Dev');

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      await page.getByText('Configuración').click();
      await page.getByText('Permisos').click();
      await expect(page).toHaveURL(/\/dashboard\/settings\/permissions/);

      await expect(page.getByText('Marketing')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('Dev')).toBeVisible();
      await expect(page.locator('select')).toBeVisible();
    });
  });

  // ─── API Tests ───────────────────────────────────────────────

  test.describe('API: Permission CRUD', () => {
    test.beforeEach(async () => {
      await resetAll();
      await resetUsers();
    });

    test('PUT /api/permissions sets permission for folder+group', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');
      const groupId = await createGroup(token, 'Dev');

      const res = await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: 'edit' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.folder_id).toBe(folderId);
      expect(json.data.group_id).toBe(groupId);
      expect(json.data.permission_level).toBe('edit');
    });

    test('PUT /api/permissions updates existing permission', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');
      const groupId = await createGroup(token, 'Dev');

      // Set to view
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: 'view' }),
      });

      // Update to edit
      const res = await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: 'edit' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.permission_level).toBe('edit');
    });

    test('PUT /api/permissions with null removes permission', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');
      const groupId = await createGroup(token, 'Dev');

      // Create permission
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: 'view' }),
      });

      // Remove by setting null
      const res = await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: null }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.deleted).toBe(true);

      // Verify removed
      const listRes = await fetch(`${API_URL}/api/permissions`, { headers: authHeaders(token) });
      const listJson = await listRes.json();
      expect(listJson.data.length).toBe(0);
    });

    test('GET /api/permissions lists all permissions', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');
      const group1 = await createGroup(token, 'Dev');
      const group2 = await createGroup(token, 'Marketing');

      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId, group_id: group1, permission_level: 'edit' }),
      });
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId, group_id: group2, permission_level: 'view' }),
      });

      const res = await fetch(`${API_URL}/api/permissions`, { headers: authHeaders(token) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBe(2);
    });

    test('PUT /api/permissions without auth returns 401', async () => {
      const res = await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: 'x', group_id: 'y', permission_level: 'view' }),
      });
      expect(res.status).toBe(401);
    });

    test('DELETE /api/permissions/:id removes permission', async () => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Root');
      const groupId = await createGroup(token, 'Dev');

      const createRes = await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: 'edit' }),
      });
      const createJson = await createRes.json();

      const res = await fetch(`${API_URL}/api/permissions/${createJson.data.id}`, {
        method: 'DELETE', headers: authHeaders(token),
      });

      expect(res.status).toBe(200);
    });
  });
});
