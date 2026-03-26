import { test, expect } from '@playwright/test';
import {
  resetUsers,
  resetCollaborationData,
  setupCollaborationTest,
} from './helpers/api';

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
      await resetCollaborationData();
      await resetUsers();
    });

    test('AC#3: Editor loads and allows editing with collaboration module active', async ({ page }) => {
      const { folderId } = await setupCollaborationTest();

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');

      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();

      const editor = page.locator('.cm-editor');
      await expect(editor).toBeVisible({ timeout: 5000 });

      const contentArea = page.locator('.cm-content');
      await contentArea.click();
      await page.keyboard.type('# Hello Collaboration');

      await expect(contentArea).toContainText('# Hello Collaboration');
    });

    test('AC#3: Editor preserves mode tabs and toolbar with collaboration module', async ({ page }) => {
      await setupCollaborationTest();

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');

      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();

      const modeTabs = page.locator('[data-testid="mode-tabs"]');
      await expect(modeTabs).toBeVisible({ timeout: 5000 });

      await expect(page.locator('[data-testid="mode-editor"]')).toBeVisible();
      await expect(page.locator('[data-testid="mode-hybrid"]')).toBeVisible();
      await expect(page.locator('[data-testid="mode-preview"]')).toBeVisible();
    });

    test('AC#1: Two users can open same document and see each other changes', async ({ browser }) => {
      const { user2Email } = await setupCollaborationTest();

      // Create two SEPARATE browser contexts (isolated localStorage/cookies)
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Login admin in context1
      await page1.goto('/sign-in');
      await page1.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page1.locator('input[type="password"]').fill('password123');
      await page1.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page1.waitForURL('/dashboard');

      // Login user2 in context2
      await page2.goto('/sign-in');
      await page2.getByRole('textbox', { name: 'Email' }).fill(user2Email);
      await page2.locator('input[type="password"]').fill('password123');
      await page2.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page2.waitForURL('/dashboard');

      // Admin opens document first
      await page1.getByText('Collab Folder').click();
      await page1.getByText('Collab Doc').click();
      await expect(page1.locator('.cm-editor')).toBeVisible({ timeout: 5000 });

      // Wait for admin's WebSocket to connect and sync
      await page1.waitForTimeout(3000);

      // Admin types content
      await page1.locator('.cm-content').click();
      await page1.keyboard.type('Hello from Admin', { delay: 50 });

      // Wait for content to sync to server
      await page1.waitForTimeout(2000);

      // Now user2 opens the same document
      await page2.getByText('Collab Folder').click();
      await page2.getByText('Collab Doc').click();
      await expect(page2.locator('.cm-editor')).toBeVisible({ timeout: 5000 });

      // Wait for user2's WebSocket to connect and sync
      await page2.waitForTimeout(3000);

      // Check if page2 (user2) sees admin's text
      await expect(page2.locator('.cm-content')).toContainText('Hello from Admin', { timeout: 5000 });

      await context1.close();
      await context2.close();
    });
  });
});
