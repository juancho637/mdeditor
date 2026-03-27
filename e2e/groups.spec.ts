import { test, expect } from '@playwright/test';
import { resetUsers, postSetup, postSignIn, extractCookies, getAdminToken } from './helpers/api';

const API_URL = 'http://localhost:3000';

async function createInvitedUser(adminToken: string, email: string): Promise<string> {
  // Create invitation
  const invRes = await fetch(`${API_URL}/api/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ email }),
  });
  const invJson = await invRes.json();
  // Accept invitation
  const acceptRes = await fetch(`${API_URL}/api/invitations/${invJson.data.token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User', password: 'password123' }),
  });
  const acceptJson = await acceptRes.json();
  // Get user ID by signing in
  const signInRes = await postSignIn({ email, password: 'password123' });
  // We need the user ID — let's decode from the invitation accept or find another way
  // Actually, we can get it from a list users endpoint or just use the sign-in token
  // For now, let's use the setup admin to list — but we don't have a users list endpoint
  // Workaround: parse the JWT to get the sub (user id)
  const token = acceptJson.data.access_token;
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  return payload.sub;
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function resetGroups(): Promise<void> {
  const { execSync } = await import('child_process');
  execSync(
    `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "DELETE FROM user_groups; DELETE FROM groups;"`,
    { cwd: process.cwd(), stdio: 'pipe' },
  );
}

async function resetInvitations(): Promise<void> {
  const { execSync } = await import('child_process');
  execSync(
    `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "DELETE FROM invitations;"`,
    { cwd: process.cwd(), stdio: 'pipe' },
  );
}

test.describe('Story 1-4: Gestión de Grupos de Usuarios', () => {
  // UI tests run FIRST to avoid rate limiting from API sign-in calls

  // ─── UI Tests ────────────────────────────────────────────────

  test.describe('UI: Groups Management', () => {
    test.beforeEach(async () => {
      await resetGroups();
      await resetInvitations();
      await resetUsers();
    });

    test('AC#1: Admin can create group and see it in list', async ({ page }) => {
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      await page.getByText('Configuración').click();
      await page.getByText('Grupos').click();
      await expect(page).toHaveURL(/\/dashboard\/settings\/groups/);

      await page.getByRole('textbox', { name: /nombre/i }).fill('Marketing');
      await page.getByRole('button', { name: 'Crear grupo' }).click();

      await expect(page.getByText('Marketing')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText('0 miembros')).toBeVisible();
    });

    test('AC#6: Duplicate group name shows error', async ({ page }) => {
      const token = await getAdminToken();
      await fetch(`${API_URL}/api/groups`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ name: 'Existing' }),
      });

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      await page.getByText('Configuración').click();
      await page.getByText('Grupos').click();

      await page.getByRole('textbox', { name: /nombre/i }).fill('Existing');
      await page.getByRole('button', { name: 'Crear grupo' }).click();

      await expect(page.locator('[class*="bg-destructive"]')).toBeVisible({ timeout: 5_000 });
    });
  });

  // ─── API Tests ───────────────────────────────────────────────

  test.describe('API: Group CRUD', () => {
    test.beforeEach(async () => {
      await resetGroups();
      await resetInvitations();
      await resetUsers();
    });

    test('POST /api/groups creates group with 0 members', async () => {
      const token = await getAdminToken();
      const res = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Marketing' }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.name).toBe('Marketing');
      expect(json.data.member_count).toBe(0);
    });

    test('POST /api/groups with duplicate name returns GRP002', async () => {
      const token = await getAdminToken();
      await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'Marketing' }),
      });

      const res = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: 'marketing' }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code_error).toBe('GRP002');
    });

    test('GET /api/groups lists all groups', async () => {
      const token = await getAdminToken();
      await fetch(`${API_URL}/api/groups`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ name: 'Dev' }),
      });
      await fetch(`${API_URL}/api/groups`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ name: 'Marketing' }),
      });

      const res = await fetch(`${API_URL}/api/groups`, { headers: authHeaders(token) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBe(2);
    });

    test('PUT /api/groups/:id updates group name', async () => {
      const token = await getAdminToken();
      const createRes = await fetch(`${API_URL}/api/groups`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ name: 'Old Name' }),
      });
      const createJson = await createRes.json();

      const res = await fetch(`${API_URL}/api/groups/${createJson.data.id}`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ name: 'New Name' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('New Name');
    });

    test('DELETE /api/groups/:id deletes group', async () => {
      const token = await getAdminToken();
      const createRes = await fetch(`${API_URL}/api/groups`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ name: 'ToDelete' }),
      });
      const createJson = await createRes.json();

      const res = await fetch(`${API_URL}/api/groups/${createJson.data.id}`, {
        method: 'DELETE', headers: authHeaders(token),
      });

      expect(res.status).toBe(200);

      // Verify deleted
      const listRes = await fetch(`${API_URL}/api/groups`, { headers: authHeaders(token) });
      const listJson = await listRes.json();
      expect(listJson.data.length).toBe(0);
    });

    test('POST /api/groups without auth returns 401', async () => {
      const res = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });
      expect(res.status).toBe(401);
    });
  });

  test.describe('API: Group Membership', () => {
    test.beforeEach(async () => {
      await resetGroups();
      await resetInvitations();
      await resetUsers();
    });

    test('POST /api/groups/:id/users adds user to group', async () => {
      const token = await getAdminToken();
      const userId = await createInvitedUser(token, 'member@test.com');

      // Create group
      const groupRes = await fetch(`${API_URL}/api/groups`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ name: 'Dev' }),
      });
      const groupJson = await groupRes.json();

      // Add user
      const res = await fetch(`${API_URL}/api/groups/${groupJson.data.id}/users`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ user_id: userId }),
      });

      expect(res.status).toBe(201);

      // Verify member in group detail
      const detailRes = await fetch(`${API_URL}/api/groups/${groupJson.data.id}`, {
        headers: authHeaders(token),
      });
      const detailJson = await detailRes.json();
      expect(detailJson.data.members.length).toBe(1);
      expect(detailJson.data.members[0].email).toBe('member@test.com');
    });

    test('DELETE /api/groups/:id/users/:userId removes user from group', async () => {
      const token = await getAdminToken();
      const userId = await createInvitedUser(token, 'remove@test.com');

      const groupRes = await fetch(`${API_URL}/api/groups`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ name: 'Dev' }),
      });
      const groupJson = await groupRes.json();

      // Add then remove
      await fetch(`${API_URL}/api/groups/${groupJson.data.id}/users`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ user_id: userId }),
      });

      const res = await fetch(`${API_URL}/api/groups/${groupJson.data.id}/users/${userId}`, {
        method: 'DELETE', headers: authHeaders(token),
      });

      expect(res.status).toBe(200);

      // Verify removed
      const detailRes = await fetch(`${API_URL}/api/groups/${groupJson.data.id}`, {
        headers: authHeaders(token),
      });
      const detailJson = await detailRes.json();
      expect(detailJson.data.members.length).toBe(0);
    });

    test('POST /api/groups/:id/users with duplicate returns GRP003', async () => {
      const token = await getAdminToken();
      const userId = await createInvitedUser(token, 'dup@test.com');

      const groupRes = await fetch(`${API_URL}/api/groups`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ name: 'Dev' }),
      });
      const groupJson = await groupRes.json();

      // Add twice
      await fetch(`${API_URL}/api/groups/${groupJson.data.id}/users`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ user_id: userId }),
      });

      const res = await fetch(`${API_URL}/api/groups/${groupJson.data.id}/users`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ user_id: userId }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code_error).toBe('GRP003');
    });
  });
});
