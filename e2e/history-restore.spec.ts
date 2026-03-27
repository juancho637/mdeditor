import { test, expect } from '@playwright/test';
import {
  resetCollaborationData,
  setupCollaborationTest,
  API_URL,
  runSQL,
  querySQL,
} from './helpers/api';

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

test.describe('Story 6-3: Restauración de Versiones Anteriores', () => {
  test.describe('API: Restore Snapshot Endpoint', () => {
    let adminToken: string;
    let documentId: string;
    let folderId: string;

    test.beforeAll(async () => {
      const setup = await setupCollaborationTest();
      adminToken = setup.adminToken;
      documentId = setup.documentId;
      folderId = setup.folderId;
    });

    test.afterAll(async () => {
      await resetCollaborationData();
    });

    test('AC#2: POST /api/documents/:id/snapshots/:snapshotId/restore restores document content', async () => {
      // Insert a snapshot directly to simulate history
      runSQL(`INSERT INTO document_snapshots (document_id, yjs_snapshot, content_markdown, author_id) SELECT '${documentId}', decode('01', 'hex'), '# Original Content', id FROM users WHERE email='admin@test.com';`);

      const snapshotId = querySQL(`SELECT id FROM document_snapshots WHERE document_id='${documentId}' ORDER BY created_at DESC LIMIT 1;`);

      // Update document to different content
      runSQL(`UPDATE documents SET content_markdown='# Changed Content' WHERE id='${documentId}';`);

      // Restore to the snapshot
      const res = await fetch(
        `${API_URL}/api/documents/${documentId}/snapshots/${snapshotId}/restore`,
        { method: 'POST', headers: authHeaders(adminToken) },
      );
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.data.document_id).toBe(documentId);
      expect(json.data.restored_from_snapshot_id).toBe(snapshotId);
      expect(json.data.new_snapshot_id).toBeTruthy();
      expect(json.data.message).toBe('Document restored successfully');

      // Verify document content was restored
      const docContent = querySQL(`SELECT content_markdown FROM documents WHERE id='${documentId}';`);
      expect(docContent).toBe('# Original Content');
    });

    test('AC#3: Restore creates new snapshot without deleting history', async () => {
      // Count snapshots before
      const countBefore = parseInt(querySQL(`SELECT COUNT(*) FROM document_snapshots WHERE document_id='${documentId}';`), 10);

      // Insert a snapshot
      runSQL(`INSERT INTO document_snapshots (document_id, yjs_snapshot, content_markdown, author_id) SELECT '${documentId}', decode('01', 'hex'), '# Version A', id FROM users WHERE email='admin@test.com';`);

      const snapshotId = querySQL(`SELECT id FROM document_snapshots WHERE document_id='${documentId}' ORDER BY created_at DESC LIMIT 1;`);

      // Restore
      await fetch(
        `${API_URL}/api/documents/${documentId}/snapshots/${snapshotId}/restore`,
        { method: 'POST', headers: authHeaders(adminToken) },
      );

      // Count snapshots after — should have 2 more (the inserted one + the restoration one)
      const countAfter = parseInt(querySQL(`SELECT COUNT(*) FROM document_snapshots WHERE document_id='${documentId}';`), 10);
      expect(countAfter).toBe(countBefore + 2);
    });

    test('AC#2: POST restore without auth returns 401', async () => {
      const res = await fetch(
        `${API_URL}/api/documents/${documentId}/snapshots/00000000-0000-0000-0000-000000000000/restore`,
        { method: 'POST' },
      );
      expect(res.status).toBe(401);
    });

    test('AC#2: POST restore with invalid snapshot returns 404', async () => {
      const res = await fetch(
        `${API_URL}/api/documents/${documentId}/snapshots/00000000-0000-0000-0000-000000000000/restore`,
        { method: 'POST', headers: authHeaders(adminToken) },
      );
      expect(res.status).toBe(404);
    });

    test('AC#4: POST restore with VIEW-only permission returns 403', async () => {
      // Sign in as user2 who has edit permission via group
      const signInRes = await fetch(`${API_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user2@test.com', password: 'password123' }),
      });
      const signInJson = await signInRes.json();
      const user2Token = signInJson.data.access_token;

      // Change user2's group permission to VIEW
      const groupId = querySQL("SELECT id FROM groups WHERE name='Editors' LIMIT 1;");
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT',
        headers: authHeaders(adminToken),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: 'view' }),
      });

      // Insert a snapshot
      runSQL(`INSERT INTO document_snapshots (document_id, yjs_snapshot, content_markdown, author_id) SELECT '${documentId}', decode('01', 'hex'), '# Test', id FROM users WHERE email='admin@test.com';`);
      const snapshotId = querySQL(`SELECT id FROM document_snapshots WHERE document_id='${documentId}' ORDER BY created_at DESC LIMIT 1;`);

      // Try to restore as user2 (VIEW only) — should fail
      const res = await fetch(
        `${API_URL}/api/documents/${documentId}/snapshots/${snapshotId}/restore`,
        { method: 'POST', headers: authHeaders(user2Token) },
      );
      expect(res.status).toBe(403);

      // Restore EDIT permission for cleanup
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT',
        headers: authHeaders(adminToken),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: 'edit' }),
      });
    });
  });

  test.describe('UI: Restore Button Visibility', () => {
    test.beforeEach(async () => {
      await resetCollaborationData();
      await setupCollaborationTest();
    });

    test('AC#4: Restore button NOT visible for read-only users', async ({ page }) => {
      // Login as user2, change permission to VIEW
      const adminToken = (await (await fetch(`${API_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'password123' }),
      })).json()).data.access_token;

      const folderId = querySQL("SELECT id FROM folders WHERE name='Collab Folder' LIMIT 1;");
      const groupId = querySQL("SELECT id FROM groups WHERE name='Editors' LIMIT 1;");
      const documentId = querySQL("SELECT id FROM documents WHERE title='Collab Doc' LIMIT 1;");

      // Set to VIEW permission
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT',
        headers: authHeaders(adminToken),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: 'view' }),
      });

      // Create a snapshot so there's history to view
      runSQL(`INSERT INTO document_snapshots (document_id, yjs_snapshot, content_markdown, author_id) SELECT '${documentId}', decode('01', 'hex'), '# Test', id FROM users WHERE email='admin@test.com';`);

      // Login as user2 (VIEW only)
      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('user2@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');

      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();
      await page.waitForSelector('[data-testid="mode-tabs"]', { timeout: 10000 });

      // Open activity panel
      await page.click('[data-testid="activity-panel-toggle"]');
      await expect(page.locator('[data-testid="activity-panel"]')).toBeVisible();

      // Wait for history to load and click on a snapshot
      await page.waitForSelector('[data-testid^="snapshot-entry-"]', { timeout: 10000 });
      await page.locator('[data-testid^="snapshot-entry-"]').first().click();

      // Wait for diff view
      await page.waitForSelector('[data-testid="diff-view"]', { timeout: 10000 });

      // Restore button should NOT be visible for VIEW-only user
      await expect(page.locator('[data-testid="restore-version-button"]')).not.toBeVisible();
    });

    test('AC#1: Restore button visible for edit users, shows confirmation dialog', async ({ page }) => {
      const documentId = querySQL("SELECT id FROM documents WHERE title='Collab Doc' LIMIT 1;");

      // Create a snapshot so there's history
      runSQL(`INSERT INTO document_snapshots (document_id, yjs_snapshot, content_markdown, author_id) SELECT '${documentId}', decode('01', 'hex'), '# Snapshot V1', id FROM users WHERE email='admin@test.com';`);

      // Login as admin (has EDIT)
      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');

      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();
      await page.waitForSelector('[data-testid="mode-tabs"]', { timeout: 10000 });

      // Open activity panel
      await page.click('[data-testid="activity-panel-toggle"]');
      await expect(page.locator('[data-testid="activity-panel"]')).toBeVisible();

      // Wait for history to load and click on a snapshot
      await page.waitForSelector('[data-testid^="snapshot-entry-"]', { timeout: 10000 });
      await page.locator('[data-testid^="snapshot-entry-"]').first().click();

      // Wait for diff view
      await page.waitForSelector('[data-testid="diff-view"]', { timeout: 10000 });

      // Restore button should be visible for admin
      await expect(page.locator('[data-testid="restore-version-button"]')).toBeVisible();

      // Click restore button → confirmation dialog appears
      await page.click('[data-testid="restore-version-button"]');
      await expect(page.locator('[data-testid="restore-confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="restore-confirm-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="restore-cancel-button"]')).toBeVisible();

      // Cancel dialog
      await page.click('[data-testid="restore-cancel-button"]');
      await expect(page.locator('[data-testid="restore-confirm-dialog"]')).not.toBeVisible();
    });
  });
});
