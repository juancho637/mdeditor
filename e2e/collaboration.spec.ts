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
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  return json.data.id;
}

async function createDocument(token: string, title: string, folderId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/documents`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title, folder_id: folderId }),
  });
  const json = await res.json();
  return json.data.id;
}

async function resetData(): Promise<void> {
  const { execSync } = await import('child_process');
  execSync(
    `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "DELETE FROM document_snapshots; DELETE FROM document_updates; DELETE FROM documents; DELETE FROM folders;"`,
    { cwd: process.cwd(), stdio: 'pipe' },
  );
}

test.describe('Story 5-1: Edición Colaborativa con Yjs y WebSocket', () => {

  test.describe('API: Database Schema', () => {
    test('AC#5: Collaboration tables exist after migration', async () => {
      const { execSync } = await import('child_process');

      const tablesResult = execSync(
        `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('document_updates', 'document_snapshots') ORDER BY table_name;"`,
        { cwd: process.cwd(), encoding: 'utf8' },
      );

      expect(tablesResult).toContain('document_snapshots');
      expect(tablesResult).toContain('document_updates');
    });

    test('AC#5: Documents table has yjs_state column', async () => {
      const { execSync } = await import('child_process');

      const columnResult = execSync(
        `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'yjs_state';"`,
        { cwd: process.cwd(), encoding: 'utf8' },
      );

      expect(columnResult).toContain('yjs_state');
      expect(columnResult).toContain('bytea');
    });

    test('AC#5: document_updates has correct schema', async () => {
      const { execSync } = await import('child_process');

      const columnsResult = execSync(
        `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'document_updates' ORDER BY ordinal_position;"`,
        { cwd: process.cwd(), encoding: 'utf8' },
      );

      expect(columnsResult).toContain('id');
      expect(columnsResult).toContain('document_id');
      expect(columnsResult).toContain('yjs_update');
      expect(columnsResult).toContain('author_id');
      expect(columnsResult).toContain('created_at');
    });
  });

  test.describe('UI: Collaborative Editor', () => {
    test.beforeEach(async () => {
      await resetData();
      await resetUsers();
    });

    test('AC#3: Editor loads and allows editing with collaboration module active', async ({ page }) => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Producto');
      await createDocument(token, 'Collab Doc', folderId);

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');

      await page.getByText('Producto').click();
      await page.getByText('Collab Doc').click();

      // Editor should load with CodeMirror
      const editor = page.locator('.cm-editor');
      await expect(editor).toBeVisible({ timeout: 5000 });

      // Should be able to type in the editor
      const contentArea = page.locator('.cm-content');
      await contentArea.click();
      await page.keyboard.type('# Hello Collaboration');

      await expect(contentArea).toContainText('# Hello Collaboration');
    });

    test('AC#3: Editor preserves mode tabs and toolbar with collaboration module', async ({ page }) => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Producto');
      await createDocument(token, 'Mode Test', folderId);

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');

      await page.getByText('Producto').click();
      await page.getByText('Mode Test').click();

      const modeTabs = page.locator('[data-testid="mode-tabs"]');
      await expect(modeTabs).toBeVisible({ timeout: 5000 });

      await expect(page.locator('[data-testid="mode-editor"]')).toBeVisible();
      await expect(page.locator('[data-testid="mode-hybrid"]')).toBeVisible();
      await expect(page.locator('[data-testid="mode-preview"]')).toBeVisible();
    });

    test('AC#1: Two browser contexts can open same document simultaneously', async ({ browser }) => {
      const token = await getAdminToken();
      const folderId = await createFolder(token, 'Shared');
      await createDocument(token, 'Shared Doc', folderId);

      // Create two browser contexts to simulate two users
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Login on both pages
      for (const page of [page1, page2]) {
        await page.goto('/sign-in');
        await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
        await page.locator('input[type="password"]').fill('password123');
        await page.getByRole('button', { name: 'Iniciar sesión' }).click();
        await page.waitForURL('/dashboard');
      }

      // Both navigate to the same document
      for (const page of [page1, page2]) {
        await page.getByText('Shared').click();
        await page.getByText('Shared Doc').click();
      }

      // Both editors should load
      await expect(page1.locator('.cm-editor')).toBeVisible({ timeout: 5000 });
      await expect(page2.locator('.cm-editor')).toBeVisible({ timeout: 5000 });

      // Type in page1
      await page1.locator('.cm-content').click();
      await page1.keyboard.type('Hello from user 1');

      // Content should appear in page1
      await expect(page1.locator('.cm-content')).toContainText('Hello from user 1');

      // Type in page2
      await page2.locator('.cm-content').click();
      await page2.keyboard.type('Hello from user 2');

      // Content should appear in page2
      await expect(page2.locator('.cm-content')).toContainText('Hello from user 2');

      await context1.close();
      await context2.close();
    });
  });
});
