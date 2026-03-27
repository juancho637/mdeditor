import { test, expect } from '@playwright/test';
import { resetUsers, postSetup, postSignIn, extractCookies, API_URL, runSQL } from './helpers/api';

async function createAdminAndGetToken(): Promise<{ accessToken: string; cookies: string }> {
  const setupRes = await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
  const cookies = extractCookies(setupRes);
  const json = await setupRes.json();
  return { accessToken: json.data.access_token, cookies };
}

async function postInvitation(accessToken: string, email: string): Promise<Response> {
  return fetch(`${API_URL}/api/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email }),
  });
}

async function getInvitation(token: string): Promise<Response> {
  return fetch(`${API_URL}/api/invitations/${token}`);
}

async function acceptInvitation(token: string, data: { name: string; password: string }): Promise<Response> {
  return fetch(`${API_URL}/api/invitations/${token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

async function resetInvitations(): Promise<void> {
  runSQL('DELETE FROM invitations;');
}

test.describe('Story 1-3: Invitación de Nuevos Usuarios', () => {
  // ─── API Tests ───────────────────────────────────────────────

  test.describe('API: Create Invitation', () => {
    test.beforeEach(async () => {
      await resetInvitations();
      await resetUsers();
    });

    test('POST /api/invitations creates invitation with link (admin only)', async () => {
      const { accessToken } = await createAdminAndGetToken();

      const res = await postInvitation(accessToken, 'nuevo@equipo.com');

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.email).toBe('nuevo@equipo.com');
      expect(json.data.token).toBeTruthy();
      expect(json.data.status).toBe('pending');
      expect(json.data.invitation_link).toContain('/invite/');
    });

    test('POST /api/invitations with existing user email returns INV003', async () => {
      const { accessToken } = await createAdminAndGetToken();

      const res = await postInvitation(accessToken, 'admin@test.com');

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code_error).toBe('INV003');
    });

    test('POST /api/invitations with duplicate pending invitation returns INV004', async () => {
      const { accessToken } = await createAdminAndGetToken();

      await postInvitation(accessToken, 'duplicate@test.com');
      const res = await postInvitation(accessToken, 'duplicate@test.com');

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code_error).toBe('INV004');
    });

    test('POST /api/invitations without auth returns 401', async () => {
      const res = await fetch(`${API_URL}/api/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' }),
      });

      expect(res.status).toBe(401);
    });
  });

  test.describe('API: Get Invitation by Token', () => {
    test.beforeEach(async () => {
      await resetInvitations();
      await resetUsers();
    });

    test('GET /api/invitations/:token returns public info for pending invitation', async () => {
      const { accessToken } = await createAdminAndGetToken();
      const createRes = await postInvitation(accessToken, 'invited@test.com');
      const createJson = await createRes.json();

      const res = await getInvitation(createJson.data.token);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.email).toBe('invited@test.com');
      expect(json.data.status).toBe('pending');
    });

    test('GET /api/invitations/:token with invalid token returns 404', async () => {
      const res = await getInvitation('nonexistent-token');

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code_error).toBe('INV001');
    });
  });

  test.describe('API: Accept Invitation', () => {
    test.beforeEach(async () => {
      await resetInvitations();
      await resetUsers();
    });

    test('POST /api/invitations/:token/accept creates user and returns access_token', async () => {
      const { accessToken } = await createAdminAndGetToken();
      const createRes = await postInvitation(accessToken, 'newuser@test.com');
      const createJson = await createRes.json();

      const res = await acceptInvitation(createJson.data.token, {
        name: 'New User',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.access_token).toBeTruthy();
      // Should set httpOnly refresh cookie
      const cookies = extractCookies(res);
      expect(cookies).toContain('refresh_token=');
    });

    test('POST /api/invitations/:token/accept with already used invitation returns INV002', async () => {
      const { accessToken } = await createAdminAndGetToken();
      const createRes = await postInvitation(accessToken, 'once@test.com');
      const createJson = await createRes.json();

      // Accept first time
      await acceptInvitation(createJson.data.token, { name: 'User', password: 'password123' });

      // Try again
      const res = await acceptInvitation(createJson.data.token, { name: 'User2', password: 'password456' });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code_error).toBe('INV002');
    });

    test('POST /api/invitations/:token/accept with invalid token returns 404', async () => {
      await createAdminAndGetToken();

      const res = await acceptInvitation('fake-token', { name: 'User', password: 'password123' });

      expect(res.status).toBe(404);
    });
  });

  // ─── UI Tests ────────────────────────────────────────────────

  test.describe('UI: Invite Flow — Happy Path', () => {
    test.beforeEach(async () => {
      await resetInvitations();
      await resetUsers();
    });

    test('AC#1: Admin can create invitation and see copiable link', async ({ page }) => {
      // Setup admin via API
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      // Login via UI
      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Navigate to settings
      await page.getByText('Configuración').click();
      await expect(page).toHaveURL(/\/dashboard\/settings\/users/);

      // Create invitation
      await page.getByRole('textbox', { name: /email/i }).fill('invited@test.com');
      await page.getByRole('button', { name: 'Invitar' }).click();

      // Should see toast and copiable link
      await expect(page.getByText('Invitación creada')).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('code')).toContainText('/invite/');
    });

    test('AC#2: Invited user can register via invitation link', async ({ page }) => {
      // Create invitation via API
      const { accessToken } = await createAdminAndGetToken();
      const createRes = await postInvitation(accessToken, 'invited@test.com');
      const createJson = await createRes.json();
      const token = createJson.data.token;

      // Open invitation link
      await page.goto(`/invite/${token}`);

      // Email should be pre-filled and disabled
      const emailInput = page.getByRole('textbox', { name: 'Email' });
      await expect(emailInput).toHaveValue('invited@test.com');
      await expect(emailInput).toBeDisabled();

      // Fill name and password
      await page.getByRole('textbox', { name: 'Nombre' }).fill('Invited User');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Crear cuenta' }).click();

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    });

    test('AC#4: Used invitation shows already-used message', async ({ page }) => {
      // Create and accept invitation via API
      const { accessToken } = await createAdminAndGetToken();
      const createRes = await postInvitation(accessToken, 'used@test.com');
      const createJson = await createRes.json();
      const token = createJson.data.token;
      await acceptInvitation(token, { name: 'User', password: 'password123' });

      // Open used invitation link
      await page.goto(`/invite/${token}`);

      await expect(page.getByText('Invitación ya utilizada')).toBeVisible();
      await expect(page.getByText('Ir a iniciar sesión')).toBeVisible();
    });

    test('Invalid invitation token shows error', async ({ page }) => {
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/invite/nonexistent-token');

      await expect(page.getByText('Invitación no válida')).toBeVisible();
    });
  });

  test.describe('UI: Invite Flow — Fail Path', () => {
    test.beforeEach(async () => {
      await resetInvitations();
      await resetUsers();
    });

    test('AC#3: Inviting existing user email shows error', async ({ page }) => {
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      await page.getByText('Configuración').click();
      await page.getByRole('textbox', { name: /email/i }).fill('admin@test.com');
      await page.getByRole('button', { name: 'Invitar' }).click();

      await expect(page.locator('[class*="bg-destructive"]')).toBeVisible({ timeout: 5_000 });
    });
  });
});
