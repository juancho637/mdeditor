import { test, expect } from '@playwright/test';
import { resetAndSeedUsers, API_URL, runSQL } from './helpers/api';

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

async function createDocument(token: string, title: string, folderId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/documents`, {
    method: 'POST', headers: authHeaders(token),
    body: JSON.stringify({ title, folder_id: folderId }),
  });
  const json = await res.json();
  return json.data.id;
}

async function resetAll(): Promise<void> {
  runSQL('DELETE FROM folder_permissions; DELETE FROM documents; DELETE FROM folders;');
}

test.describe('Story 4-1: Editor Markdown con CodeMirror 6', () => {
  let adminToken: string;

  test.describe('UI: CodeMirror Editor', () => {
    test.beforeEach(async () => {
      await resetAll();
      adminToken = await resetAndSeedUsers();
    });

    test('AC#1: Document opens with CodeMirror editor (not textarea)', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'Docs');
      await createDocument(token, 'Test Doc', folderId);

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Select folder
      await page.getByText('Docs').click();
      // Open document
      await page.getByText('Test Doc').first().click();

      // Should see CodeMirror (cm-editor class), NOT a textarea
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('textarea')).not.toBeVisible();
    });

    test('AC#5: Typing triggers autosave with badge', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'Docs');
      await createDocument(token, 'Autosave Test', folderId);

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      await page.getByText('Docs').click();
      await page.getByText('Autosave Test').first().click();

      // Wait for editor to load
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });

      // Type in CodeMirror
      await page.locator('.cm-content').click();
      await page.keyboard.type('# Hello World');

      // Wait for autosave badge
      await expect(page.getByText('✓ Guardado')).toBeVisible({ timeout: 10_000 });
    });

    test('AC#1: Switch to Preview mode shows rendered markdown', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'Renders');

      // Create document with markdown content via API
      const docRes = await fetch(`${API_URL}/api/documents`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ title: 'MD Doc', folder_id: folderId }),
      });
      const docJson = await docRes.json();
      await fetch(`${API_URL}/api/documents/${docJson.data.id}`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ content_markdown: '# Hello\n\nThis is **bold** and *italic*.' }),
      });

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Open folder then document
      await page.getByText('Renders').click();
      await page.getByText('MD Doc').first().click();

      // Wait for editor to load
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });

      // Switch to Preview mode
      await page.getByRole('button', { name: 'Preview', exact: true }).click();

      // Should see rendered HTML
      await expect(page.locator('.prose h1')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('.prose strong')).toBeVisible();
    });
  });
});
