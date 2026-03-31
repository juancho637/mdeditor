import { test, expect, type Page } from '@playwright/test';
import { API_URL, resetAndSeedUsers } from './helpers/api';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function createApiKey(token: string, name: string) {
  const res = await fetch(`${API_URL}/api/mcp/keys`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  return { status: res.status, data: (await res.json()).data };
}

async function listApiKeys(token: string) {
  const res = await fetch(`${API_URL}/api/mcp/keys`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  return { status: res.status, data: (await res.json()).data };
}

async function revokeApiKey(token: string, id: string) {
  const res = await fetch(`${API_URL}/api/mcp/keys/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return { status: res.status, data: (await res.json()).data };
}

async function loginAndNavigateToApiKeys(page: Page) {
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL('/dashboard');
  await page.goto('/settings/api-keys');
  await page.waitForLoadState('networkidle');
}

test.describe('Story 7-3: Gestión de API Keys', () => {
  test.describe('API: List API Keys', () => {
    test('GET /api/mcp/keys returns empty list initially', async () => {
      const adminToken = await resetAndSeedUsers();
      const { status, data } = await listApiKeys(adminToken);

      expect(status).toBe(200);
      expect(data).toEqual([]);
    });

    test('GET /api/mcp/keys returns created keys with correct fields', async () => {
      const adminToken = await resetAndSeedUsers();
      await createApiKey(adminToken, 'Key 1');
      await createApiKey(adminToken, 'Key 2');

      const { status, data } = await listApiKeys(adminToken);

      expect(status).toBe(200);
      expect(data).toHaveLength(2);
      // Ordered by createdAt DESC
      expect(data[0].name).toBe('Key 2');
      expect(data[1].name).toBe('Key 1');
      // Verify wire format fields
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('prefix');
      expect(data[0]).toHaveProperty('is_active', true);
      expect(data[0]).toHaveProperty('last_used_at', null);
      expect(data[0]).toHaveProperty('created_at');
      // Should NOT expose raw key or hash
      expect(data[0]).not.toHaveProperty('api_key');
      expect(data[0]).not.toHaveProperty('key_hash');
    });

    test('GET /api/mcp/keys without auth returns 401', async () => {
      const res = await fetch(`${API_URL}/api/mcp/keys`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(res.status).toBe(401);
    });
  });

  test.describe('API: Create API Key with limit', () => {
    test('POST /api/mcp/keys creates key with mk_ prefix (AC#2)', async () => {
      const adminToken = await resetAndSeedUsers();
      const { status, data } = await createApiKey(adminToken, 'Claude Code');

      expect(status).toBe(201);
      expect(data.api_key).toMatch(/^mk_/);
      expect(data.prefix).toMatch(/^mk_/);
      expect(data.name).toBe('Claude Code');
      expect(data.id).toBeTruthy();
      expect(data.created_at).toBeTruthy();
    });

    test('POST /api/mcp/keys returns AKY005 when 3 active keys exist (AC#4)', async () => {
      const adminToken = await resetAndSeedUsers();

      await createApiKey(adminToken, 'Key 1');
      await createApiKey(adminToken, 'Key 2');
      await createApiKey(adminToken, 'Key 3');

      const res = await fetch(`${API_URL}/api/mcp/keys`, {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: JSON.stringify({ name: 'Key 4' }),
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.code_error).toBe('AKY005');
    });

    test('Revoking a key allows creating a new one within limit', async () => {
      const adminToken = await resetAndSeedUsers();

      const { data: key1 } = await createApiKey(adminToken, 'Key 1');
      await createApiKey(adminToken, 'Key 2');
      await createApiKey(adminToken, 'Key 3');

      // Revoke one
      await revokeApiKey(adminToken, key1.id);

      // Should now be able to create a 4th
      const { status } = await createApiKey(adminToken, 'Key 4');
      expect(status).toBe(201);
    });
  });

  test.describe('API: Revoke API Key', () => {
    test('DELETE /api/mcp/keys/:id revokes key successfully (AC#3)', async () => {
      const adminToken = await resetAndSeedUsers();
      const { data: key } = await createApiKey(adminToken, 'To Revoke');

      const { status, data } = await revokeApiKey(adminToken, key.id);

      expect(status).toBe(200);
      expect(data.revoked).toBe(true);

      // Verify key shows as revoked in list
      const { data: keys } = await listApiKeys(adminToken);
      const revokedKey = keys.find((k: { id: string }) => k.id === key.id);
      expect(revokedKey.is_active).toBe(false);
    });

    test('DELETE /api/mcp/keys/:id with invalid UUID returns 404', async () => {
      const adminToken = await resetAndSeedUsers();
      const res = await fetch(
        `${API_URL}/api/mcp/keys/00000000-0000-0000-0000-000000000000`,
        {
          method: 'DELETE',
          headers: authHeaders(adminToken),
        },
      );

      expect(res.status).toBe(404);
    });

    test('DELETE /api/mcp/keys/:id without auth returns 401', async () => {
      const res = await fetch(
        `${API_URL}/api/mcp/keys/00000000-0000-0000-0000-000000000000`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      expect(res.status).toBe(401);
    });

    test('Revoked key is rejected by MCP auth (AC#3)', async () => {
      const adminToken = await resetAndSeedUsers();
      const { data: key } = await createApiKey(adminToken, 'Revoke Me');

      const mcpBody = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0' },
        },
      });
      const mcpHeaders = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${key.api_key}`,
      };

      // Use key successfully first
      const resOk = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: mcpHeaders,
        body: mcpBody,
      });
      expect(resOk.status).toBe(200);

      // Revoke it
      await revokeApiKey(adminToken, key.id);

      // Now it should be rejected
      const resFail = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: {
          ...mcpHeaders,
          Authorization: `Bearer ${key.api_key}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'initialize',
          params: {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0' },
          },
        }),
      });
      expect(resFail.status).toBe(401);
    });
  });

  test.describe('UI: API Keys Settings Page', () => {
    test('AC#1: API Keys page shows in settings navigation', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      // Create a key via API first
      await createApiKey(adminToken, 'Existing Key');

      await loginAndNavigateToApiKeys(page);

      // Navigation link exists
      const navLink = page.locator('a[href="/settings/api-keys"]');
      await expect(navLink).toBeVisible();
      await expect(navLink).toHaveText('API Keys');

      // Page title
      await expect(page.locator('h2')).toContainText('API Keys');

      // Existing key is displayed
      await expect(page.getByText('Existing Key')).toBeVisible();
      await expect(
        page.locator('[data-testid^="api-key-status-"]').first(),
      ).toContainText('Activa');
    });

    test('AC#1: Empty state shown when no keys', async ({ page }) => {
      await resetAndSeedUsers();
      await loginAndNavigateToApiKeys(page);

      await expect(page.getByTestId('api-keys-empty-state')).toBeVisible();
      await expect(page.getByText('No tienes API keys')).toBeVisible();
    });

    test('AC#2: Generate API Key flow shows key once with copy option', async ({
      page,
    }) => {
      await resetAndSeedUsers();
      await loginAndNavigateToApiKeys(page);

      // Click generate
      await page.getByTestId('generate-api-key-button').click();

      // Dialog appears
      await expect(page.getByTestId('create-api-key-dialog')).toBeVisible();

      // Enter name and generate
      await page.getByTestId('api-key-name-input').fill('My Claude Key');
      await page.getByTestId('api-key-generate-button').click();

      // Raw key is shown
      const rawKeyElement = page.getByTestId('api-key-raw-value');
      await expect(rawKeyElement).toBeVisible();
      const rawKey = await rawKeyElement.textContent();
      expect(rawKey).toMatch(/^mk_/);

      // Warning message
      await expect(
        page.getByText('Esta key solo se mostrará una vez'),
      ).toBeVisible();

      // Copy button exists
      await expect(page.getByTestId('api-key-copy-button')).toBeVisible();

      // Close dialog
      await page.getByTestId('api-key-close-button').click();

      // Key appears in list
      await expect(page.getByText('My Claude Key')).toBeVisible();
    });

    test('AC#3: Revoke API Key shows confirmation dialog', async ({ page }) => {
      const adminToken = await resetAndSeedUsers();
      await createApiKey(adminToken, 'Key to Revoke');

      await loginAndNavigateToApiKeys(page);

      // Click revoke
      const revokeButton = page
        .locator('[data-testid^="api-key-revoke-"]')
        .first();
      await revokeButton.click();

      // Confirmation dialog
      await expect(page.getByTestId('revoke-api-key-dialog')).toBeVisible();
      await expect(
        page.getByTestId('revoke-api-key-dialog').getByText('Key to Revoke'),
      ).toBeVisible();
      await expect(
        page.getByText('dejarán de funcionar inmediatamente'),
      ).toBeVisible();

      // Confirm revoke
      await page.getByTestId('revoke-confirm-button').click();

      // Key shows as revoked
      await expect(page.getByText('Revocada')).toBeVisible();

      // Revoke button disappears for this key
      await expect(revokeButton).not.toBeVisible();
    });

    test('AC#4: Generate button disabled when 3 active keys', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      await createApiKey(adminToken, 'Key 1');
      await createApiKey(adminToken, 'Key 2');
      await createApiKey(adminToken, 'Key 3');

      await loginAndNavigateToApiKeys(page);

      const generateButton = page.getByTestId('generate-api-key-button');
      await expect(generateButton).toBeDisabled();
      await expect(page.getByText('3 de 3 keys activas')).toBeVisible();
    });
  });
});
