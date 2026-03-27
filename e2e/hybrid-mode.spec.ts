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

async function createDocumentWithContent(
  token: string,
  title: string,
  folderId: string,
  content: string,
): Promise<string> {
  const docRes = await fetch(`${API_URL}/api/documents`, {
    method: 'POST', headers: authHeaders(token),
    body: JSON.stringify({ title, folder_id: folderId }),
  });
  const docJson = await docRes.json();
  const docId = docJson.data.id;

  await fetch(`${API_URL}/api/documents/${docId}`, {
    method: 'PUT', headers: authHeaders(token),
    body: JSON.stringify({ content_markdown: content }),
  });

  return docId;
}

async function resetAll(): Promise<void> {
  runSQL('DELETE FROM folder_permissions; DELETE FROM documents; DELETE FROM folders; DELETE FROM user_groups; DELETE FROM groups; DELETE FROM invitations;');
}

async function loginAndNavigateToDoc(page: import('@playwright/test').Page, folderName: string, docTitle: string) {
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  await page.getByText(folderName).click();
  await page.getByText(docTitle).first().click();
}

test.describe('Story 4-3: Modo Híbrido y Cambio entre Modos', () => {
  let adminToken: string;

  test.describe('UI: Mode Tabs', () => {
    test.beforeEach(async () => {
      await resetAll();
      adminToken = await resetAndSeedUsers();
    });

    test('AC#1: Three mode tabs appear for editable document', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'HybridDocs');
      await createDocumentWithContent(token, 'Hybrid Test', folderId, '# Test Content');

      await loginAndNavigateToDoc(page, 'HybridDocs', 'Hybrid Test');

      // Wait for editor to load
      const modeTabs = page.getByTestId('mode-tabs');
      await expect(modeTabs).toBeVisible({ timeout: 10_000 });

      // Verify all 3 mode buttons exist
      await expect(page.getByTestId('mode-editor')).toBeVisible();
      await expect(page.getByTestId('mode-hybrid')).toBeVisible();
      await expect(page.getByTestId('mode-preview')).toBeVisible();
    });

    test('AC#2: Hybrid mode shows editor and preview side-by-side', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'SplitDocs');
      await createDocumentWithContent(token, 'Split Test', folderId, '# Hello World\n\nSome **bold** text.');

      await loginAndNavigateToDoc(page, 'SplitDocs', 'Split Test');

      // Click Hybrid mode
      await page.getByTestId('mode-hybrid').click();

      // Both editor and preview should be visible
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('.prose')).toBeVisible({ timeout: 10_000 });

      // Preview should render the markdown
      await expect(page.locator('.prose h1')).toBeVisible();
      await expect(page.locator('.prose strong')).toBeVisible();
    });

    test('AC#2+: Typing in hybrid mode updates preview in real time', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'RealtimeDocs');
      await createDocumentWithContent(token, 'Realtime Test', folderId, '');

      await loginAndNavigateToDoc(page, 'RealtimeDocs', 'Realtime Test');

      // Switch to Hybrid mode
      await page.getByTestId('mode-hybrid').click();
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });

      // Type in the editor
      await page.locator('.cm-content').click();
      await page.keyboard.type('# Live Preview');

      // Preview should update with the typed content
      await expect(page.locator('.prose h1')).toContainText('Live Preview', { timeout: 10_000 });
    });

    test('AC#4: Switching modes preserves content', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'SwitchDocs');
      await createDocumentWithContent(token, 'Switch Test', folderId, '# Original Content');

      await loginAndNavigateToDoc(page, 'SwitchDocs', 'Switch Test');

      // Start in Hybrid mode (default for new user)
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });

      // Switch to Editor
      await page.getByTestId('mode-editor').click();
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 5_000 });

      // Switch to Preview
      await page.getByTestId('mode-preview').click();
      await expect(page.locator('.prose h1')).toContainText('Original Content', { timeout: 5_000 });

      // Switch back to Hybrid
      await page.getByTestId('mode-hybrid').click();
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('.prose h1')).toContainText('Original Content', { timeout: 5_000 });
    });

    test('AC#5: Editor mode shows only CodeMirror', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'EditorOnlyDocs');
      await createDocumentWithContent(token, 'Editor Only Test', folderId, '# Test');

      await loginAndNavigateToDoc(page, 'EditorOnlyDocs', 'Editor Only Test');

      // Click Editor mode
      await page.getByTestId('mode-editor').click();

      // Only editor should be visible, not preview
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('.prose')).not.toBeVisible();
    });

    test('AC#6: Mode preference persists across page reload', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'PersistDocs');
      await createDocumentWithContent(token, 'Persist Test', folderId, '# Persist');

      await loginAndNavigateToDoc(page, 'PersistDocs', 'Persist Test');

      // Wait for default mode to load
      await expect(page.getByTestId('mode-tabs')).toBeVisible({ timeout: 10_000 });

      // Switch to Editor mode
      await page.getByTestId('mode-editor').click();
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 5_000 });

      // Reload the page
      await page.reload();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Navigate back to document
      await page.getByText('PersistDocs').click();
      await page.getByText('Persist Test').first().click();

      // Should be in Editor mode (persisted preference)
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });
      // Verify .prose is NOT visible (not in hybrid or preview)
      await expect(page.locator('.prose')).not.toBeVisible();
    });

    test('AC#6: Default mode is Hybrid for new user', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'DefaultDocs');
      await createDocumentWithContent(token, 'Default Mode Test', folderId, '# Default');

      await loginAndNavigateToDoc(page, 'DefaultDocs', 'Default Mode Test');

      // Default mode should be Hybrid — both editor and preview visible
      await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('.prose')).toBeVisible({ timeout: 5_000 });
    });
  });
});
