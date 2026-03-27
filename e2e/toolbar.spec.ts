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

async function loginAndOpenDocument(page: import('@playwright/test').Page, folderName: string, docTitle: string) {
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  await page.getByText(folderName).click();
  await page.getByText(docTitle).first().click();
  await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10_000 });
}

test.describe('Story 4-4: Toolbar de Asistencia Markdown', () => {
  let adminToken: string;

  test.describe('UI: Toolbar Visibility', () => {
    test.beforeEach(async () => {
      await resetAll();
      adminToken = await resetAndSeedUsers();
    });

    test('AC#1: Toolbar visible in Editor mode with 4 groups of buttons', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'ToolbarDocs');
      await createDocument(token, 'Toolbar Test', folderId);

      await loginAndOpenDocument(page, 'ToolbarDocs', 'Toolbar Test');

      // Switch to Editor mode
      await page.getByTestId('mode-editor').click();

      // Toolbar should be visible
      const toolbar = page.getByTestId('markdown-toolbar');
      await expect(toolbar).toBeVisible();

      // Verify key buttons exist
      await expect(page.getByTestId('toolbar-bold')).toBeVisible();
      await expect(page.getByTestId('toolbar-italic')).toBeVisible();
      await expect(page.getByTestId('toolbar-strikethrough')).toBeVisible();
      await expect(page.getByTestId('toolbar-bullet_list')).toBeVisible();
      await expect(page.getByTestId('toolbar-numbered_list')).toBeVisible();
      await expect(page.getByTestId('toolbar-checklist')).toBeVisible();
      await expect(page.getByTestId('toolbar-link')).toBeVisible();
      await expect(page.getByTestId('toolbar-image')).toBeVisible();
      await expect(page.getByTestId('toolbar-code')).toBeVisible();
      await expect(page.getByTestId('toolbar-table')).toBeVisible();
      await expect(page.getByTestId('toolbar-blockquote')).toBeVisible();
      await expect(page.getByTestId('toolbar-horizontal_rule')).toBeVisible();
      await expect(page.getByTestId('toolbar-heading_1')).toBeVisible();
    });

    test('AC#1: Toolbar visible in Hybrid mode', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'HybridDocs');
      await createDocument(token, 'Hybrid Test', folderId);

      await loginAndOpenDocument(page, 'HybridDocs', 'Hybrid Test');

      await page.getByTestId('mode-hybrid').click();

      await expect(page.getByTestId('markdown-toolbar')).toBeVisible();
    });

    test('AC#7: Toolbar hidden in Preview mode', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'PreviewDocs');
      await createDocument(token, 'Preview Test', folderId);

      await loginAndOpenDocument(page, 'PreviewDocs', 'Preview Test');

      // Switch to Preview mode
      await page.getByTestId('mode-preview').click();

      await expect(page.getByTestId('markdown-toolbar')).not.toBeVisible();
    });
  });

  test.describe('UI: Toolbar Actions', () => {
    test.beforeEach(async () => {
      await resetAll();
      adminToken = await resetAndSeedUsers();
    });

    test('AC#2: Click Bold with text selected wraps with **', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'BoldDocs');
      const docId = await createDocument(token, 'Bold Test', folderId);

      // Pre-fill content
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ content_markdown: 'hello world' }),
      });

      await loginAndOpenDocument(page, 'BoldDocs', 'Bold Test');
      await page.getByTestId('mode-editor').click();

      // Select "hello" in editor
      await page.locator('.cm-content').click();
      await page.keyboard.press('Home');
      await page.keyboard.press('Shift+End');

      // Select just "hello" - use keyboard to position
      await page.locator('.cm-content').click();
      // Triple-click to select all text in line
      await page.locator('.cm-content').click({ clickCount: 3 });

      // Click bold button
      await page.getByTestId('toolbar-bold').click();

      // Verify content now has ** wrapping
      await expect(page.locator('.cm-content')).toContainText('**hello world**');
    });

    test('AC#3: Click Bold without selection inserts placeholder', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'PlaceholderDocs');
      await createDocument(token, 'Placeholder Test', folderId);

      await loginAndOpenDocument(page, 'PlaceholderDocs', 'Placeholder Test');
      await page.getByTestId('mode-editor').click();

      // Click in editor (no selection)
      await page.locator('.cm-content').click();

      // Click bold button
      await page.getByTestId('toolbar-bold').click();

      // Should insert **text** placeholder
      await expect(page.locator('.cm-content')).toContainText('**text**');
    });

    test('AC#4: Header dropdown shows H1-H6, selecting H2 inserts ## ', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'HeaderDocs');
      await createDocument(token, 'Header Test', folderId);

      await loginAndOpenDocument(page, 'HeaderDocs', 'Header Test');
      await page.getByTestId('mode-editor').click();

      // Click in editor
      await page.locator('.cm-content').click();

      // Click header button to open dropdown
      await page.getByTestId('toolbar-heading_1').click();

      // Dropdown should be visible with H1-H6 options
      await expect(page.getByTestId('header-dropdown')).toBeVisible();

      // Select H2
      await page.getByTestId('header-heading_2').click();

      // Verify ## was inserted
      await expect(page.locator('.cm-content')).toContainText('##');
    });

    test('AC#5: Link popover inserts [text](url)', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'LinkDocs');
      await createDocument(token, 'Link Test', folderId);

      await loginAndOpenDocument(page, 'LinkDocs', 'Link Test');
      await page.getByTestId('mode-editor').click();

      // Click in editor
      await page.locator('.cm-content').click();

      // Click link button to open popover
      await page.getByTestId('toolbar-link').click();

      // Popover should be visible
      await expect(page.getByTestId('link-popover')).toBeVisible();

      // Type URL
      await page.getByTestId('link-url-input').fill('https://example.com');

      // Click insert
      await page.getByTestId('link-insert-btn').click();

      // Verify link was inserted
      await expect(page.locator('.cm-content')).toContainText('[text](https://example.com)');
    });

    test('AC#6: Table dropdown inserts table template', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'TableDocs');
      await createDocument(token, 'Table Test', folderId);

      await loginAndOpenDocument(page, 'TableDocs', 'Table Test');
      await page.getByTestId('mode-editor').click();

      // Click in editor
      await page.locator('.cm-content').click();

      // Click table button
      await page.getByTestId('toolbar-table').click();

      // Table dropdown should be visible
      await expect(page.getByTestId('table-dropdown')).toBeVisible();

      // Click a 3x3 cell (row 2, col 2 = index 2,2)
      await page.getByTestId('table-cell-2-2').click();

      // Verify table was inserted (contains header markers)
      await expect(page.locator('.cm-content')).toContainText('Header 1');
      await expect(page.locator('.cm-content')).toContainText('---');
    });
  });

  test.describe('UI: Keyboard Shortcuts', () => {
    test.beforeEach(async () => {
      await resetAll();
      adminToken = await resetAndSeedUsers();
    });

    test('Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+E shortcuts work', async ({ page }) => {
      const token = adminToken;
      const folderId = await createFolder(token, 'ShortcutDocs');
      await createDocument(token, 'Shortcut Test', folderId);

      await loginAndOpenDocument(page, 'ShortcutDocs', 'Shortcut Test');
      await page.getByTestId('mode-editor').click();

      // Click in editor and wait for focus
      await page.locator('.cm-content').click();
      await page.waitForTimeout(200);

      // Use Meta (Cmd on macOS) — CodeMirror uses Mod which maps to Meta on macOS
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

      // Mod+B - Bold
      await page.keyboard.press(`${modifier}+b`);
      await expect(page.locator('.cm-content')).toContainText('**text**');

      // Move cursor to end and press Enter for new line
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');

      // Mod+I - Italic
      await page.keyboard.press(`${modifier}+i`);
      await expect(page.locator('.cm-content')).toContainText('*text*');

      // Move to new line
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');

      // Mod+E - Code
      await page.keyboard.press(`${modifier}+e`);
      await expect(page.locator('.cm-content')).toContainText('`text`');

      // Move to new line
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');

      // Mod+K - Link
      await page.keyboard.press(`${modifier}+k`);
      await expect(page.locator('.cm-content')).toContainText('[text](url)');
    });
  });
});
