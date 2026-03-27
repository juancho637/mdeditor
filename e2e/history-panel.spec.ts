import { test, expect } from '@playwright/test';
import {
  resetCollaborationData,
  setupCollaborationTest,
  API_URL,
} from './helpers/api';

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function loginAndNavigateToDoc(page: any, folderId?: string) {
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL('/dashboard');

  await page.getByText('Collab Folder').click();
  await page.getByText('Collab Doc').click();
  await page.waitForSelector('[data-testid="mode-tabs"]', { timeout: 10000 });
}

test.describe('Story 6-2: Visualización del Historial y Panel de Actividad', () => {
  test.describe('UI: Activity Panel Toggle', () => {
    test.beforeEach(async () => {
      await resetCollaborationData();
      await setupCollaborationTest();
    });

    test('AC#1: Clicking activity icon opens panel with slide-in animation', async ({ page }) => {
      await loginAndNavigateToDoc(page);

      // Toggle button should be visible
      const toggleBtn = page.locator('[data-testid="activity-panel-toggle"]');
      await expect(toggleBtn).toBeVisible();

      // Panel should NOT be visible initially
      await expect(page.locator('[data-testid="activity-panel"]')).not.toBeVisible();

      // Click toggle → panel opens
      await toggleBtn.click();
      const panel = page.locator('[data-testid="activity-panel"]');
      await expect(panel).toBeVisible();
    });

    test('AC#5: Clicking toggle again closes panel', async ({ page }) => {
      await loginAndNavigateToDoc(page);

      const toggleBtn = page.locator('[data-testid="activity-panel-toggle"]');

      // Open panel
      await toggleBtn.click();
      await expect(page.locator('[data-testid="activity-panel"]')).toBeVisible();

      // Close panel via toggle
      await toggleBtn.click();
      await expect(page.locator('[data-testid="activity-panel"]')).not.toBeVisible();
    });

    test('AC#5: Panel state persists across page reload', async ({ page }) => {
      await loginAndNavigateToDoc(page);

      // Open panel
      await page.click('[data-testid="activity-panel-toggle"]');
      await expect(page.locator('[data-testid="activity-panel"]')).toBeVisible();

      // Reload and re-navigate to the same document
      await page.reload();
      await page.waitForURL('/dashboard');
      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();
      await page.waitForSelector('[data-testid="mode-tabs"]', { timeout: 10000 });

      // Panel should still be open (persisted in localStorage)
      await expect(page.locator('[data-testid="activity-panel"]')).toBeVisible();

      // Clean up: close panel
      await page.click('[data-testid="activity-panel-toggle"]');
    });

    test('AC#1: Panel can be closed via X button', async ({ page }) => {
      await loginAndNavigateToDoc(page);

      // Open panel
      await page.click('[data-testid="activity-panel-toggle"]');
      await expect(page.locator('[data-testid="activity-panel"]')).toBeVisible();

      // Close via X button
      await page.click('[data-testid="close-activity-panel"]');
      await expect(page.locator('[data-testid="activity-panel"]')).not.toBeVisible();
    });
  });

  test.describe('UI: Panel Content', () => {
    test.beforeEach(async () => {
      await resetCollaborationData();
      await setupCollaborationTest();
    });

    test('AC#2: Panel shows section headers and empty live activity', async ({ page }) => {
      await loginAndNavigateToDoc(page);

      // Open panel
      await page.click('[data-testid="activity-panel-toggle"]');
      await expect(page.locator('[data-testid="activity-panel"]')).toBeVisible();

      // Should show section headers (uppercase CSS, use getByRole)
      await expect(page.getByRole('heading', { name: 'Actividad en vivo' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible();

      // Should show "no other users" when alone
      await expect(page.locator('text=No hay otros usuarios conectados')).toBeVisible();
    });

    test('AC#3: Panel shows "No hay historial disponible" for fresh document', async ({ page }) => {
      await loginAndNavigateToDoc(page);

      // Open panel
      await page.click('[data-testid="activity-panel-toggle"]');
      await expect(page.locator('[data-testid="activity-panel"]')).toBeVisible();

      // For a fresh document with no edits, should show empty state
      await expect(page.locator('text=No hay historial disponible')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('API: Snapshot History Endpoints', () => {
    let adminToken: string;
    let documentId: string;

    test.beforeAll(async () => {
      const setup = await setupCollaborationTest();
      adminToken = setup.adminToken;
      documentId = setup.documentId;
    });

    test.afterAll(async () => {
      await resetCollaborationData();
    });

    test('AC#3: GET /api/documents/:id/snapshots returns paginated list', async () => {
      const res = await fetch(
        `${API_URL}/api/documents/${documentId}/snapshots?page=1&limit=10`,
        { headers: authHeaders(adminToken) },
      );
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toHaveProperty('snapshots');
      expect(json.data).toHaveProperty('total');
      expect(json.data).toHaveProperty('page');
      expect(json.data).toHaveProperty('limit');
      expect(Array.isArray(json.data.snapshots)).toBe(true);
    });

    test('AC#3: GET /api/documents/:id/snapshots without auth returns 401', async () => {
      const res = await fetch(`${API_URL}/api/documents/${documentId}/snapshots`);
      expect(res.status).toBe(401);
    });

    test('AC#4: GET /api/documents/:id/snapshots/:invalidId returns 404', async () => {
      const res = await fetch(
        `${API_URL}/api/documents/${documentId}/snapshots/00000000-0000-0000-0000-000000000000`,
        { headers: authHeaders(adminToken) },
      );
      expect(res.status).toBe(404);
    });
  });
});
