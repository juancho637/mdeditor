import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  API_URL,
  resetAndSeedUsers,
  createFolder,
  createDocument,
  grantUser2EditPermission,
} from './helpers/api';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function importDocuments(
  token: string,
  folderId: string,
  files: Array<{ name: string; content: string }>,
) {
  const formData = new FormData();
  formData.append('folder_id', folderId);
  for (const file of files) {
    const blob = new Blob([file.content], { type: 'text/markdown' });
    formData.append('files', blob, file.name);
  }
  const res = await fetch(`${API_URL}/api/documents/import`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
  return { status: res.status, data: await res.json() };
}

async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
) {
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL('/dashboard');
}

// ─────────────────────────────────────────────────────────────────
// Story 8-2: Import y Export de Documentos Markdown
// ─────────────────────────────────────────────────────────────────

test.describe('Story 8-2: Import y Export de Documentos Markdown', () => {
  // ── API: Import ──────────────────────────────────────────────────

  test.describe('API: Import endpoint', () => {
    test('AC#2: imports a single .md file and creates document with file title', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Import Folder');

      const { status, data } = await importDocuments(adminToken, folderId, [
        { name: 'mi-guia.md', content: '# Mi Guía\n\nContenido de la guía.' },
      ]);

      expect(status).toBe(201);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('mi-guia');
      expect(data.data[0].id).toBeTruthy();
    });

    test('AC#2: imports multiple .md files creating one document per file', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Multi Import');

      const { status, data } = await importDocuments(adminToken, folderId, [
        { name: 'file-a.md', content: '# File A' },
        { name: 'file-b.md', content: '# File B' },
        { name: 'file-c.md', content: '# File C' },
      ]);

      expect(status).toBe(201);
      expect(data.data).toHaveLength(3);
      const titles = data.data.map((d: { title: string }) => d.title);
      expect(titles).toContain('file-a');
      expect(titles).toContain('file-b');
      expect(titles).toContain('file-c');
    });

    test('AC#4: creates document with "(1)" suffix when title already exists', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Dup Folder');
      await createDocument(adminToken, 'guide', folderId);

      const { status, data } = await importDocuments(adminToken, folderId, [
        { name: 'guide.md', content: '# Guide v2' },
      ]);

      expect(status).toBe(201);
      expect(data.data[0].title).toBe('guide (1)');
    });

    test('AC#4: creates "(2)" when both base and "(1)" already exist', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Dup2 Folder');
      await createDocument(adminToken, 'guide', folderId);
      await createDocument(adminToken, 'guide (1)', folderId);

      const { status, data } = await importDocuments(adminToken, folderId, [
        { name: 'guide.md', content: '# Guide v3' },
      ]);

      expect(status).toBe(201);
      expect(data.data[0].title).toBe('guide (2)');
    });

    test('returns 401 when not authenticated', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Auth Test Folder');

      const formData = new FormData();
      formData.append('folder_id', folderId);
      formData.append(
        'files',
        new Blob(['# Test'], { type: 'text/markdown' }),
        'test.md',
      );

      const res = await fetch(`${API_URL}/api/documents/import`, {
        method: 'POST',
        body: formData,
      });
      expect(res.status).toBe(401);
    });

    test('returns 400 when folder_id is missing', async () => {
      const adminToken = await resetAndSeedUsers();

      const formData = new FormData();
      formData.append(
        'files',
        new Blob(['# Test'], { type: 'text/markdown' }),
        'test.md',
      );

      const res = await fetch(`${API_URL}/api/documents/import`, {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: formData,
      });
      expect(res.status).toBe(400);
    });

    test('returns 400 when no files are provided', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'No Files Folder');

      const formData = new FormData();
      formData.append('folder_id', folderId);

      const res = await fetch(`${API_URL}/api/documents/import`, {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: formData,
      });
      expect(res.status).toBe(400);
    });
  });

  // ── UI: Import ───────────────────────────────────────────────────

  test.describe('UI: Import button', () => {
    test('AC#1: "Importar .md" button visible when folder is selected', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'UI Import Folder');

      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByText('UI Import Folder').click();
      await page.waitForTimeout(500);

      await expect(page.getByTestId('import-documents-btn')).toBeVisible();
    });

    test('AC#1 + AC#2: clicking "Importar .md" opens file picker (input present)', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'File Picker Folder');

      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByText('File Picker Folder').click();
      await page.waitForTimeout(500);

      const fileInput = page.getByTestId('import-file-input');
      await expect(fileInput).toBeAttached();

      const acceptAttr = await fileInput.getAttribute('accept');
      expect(acceptAttr).toBe('.md');

      const multipleAttr = await fileInput.getAttribute('multiple');
      expect(multipleAttr).toBeDefined();
    });

    test('AC#2: importing a file via UI creates document and refreshes list', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'UI Import Test');

      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByText('UI Import Test').click();
      await page.waitForTimeout(500);

      const tmpDir = os.tmpdir();
      const tmpFile = path.join(tmpDir, 'test-import.md');
      fs.writeFileSync(
        tmpFile,
        '# Documento Importado\n\nContenido de prueba.',
      );

      const fileInput = page.getByTestId('import-file-input');

      const [response] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes('/api/documents/import') &&
            res.request().method() === 'POST',
        ),
        fileInput.setInputFiles(tmpFile),
      ]);

      expect(response.status()).toBe(201);

      await expect(page.getByText('test-import')).toBeVisible({
        timeout: 8000,
      });

      fs.unlinkSync(tmpFile);
    });
  });

  // ── UI: Export ───────────────────────────────────────────────────

  test.describe('UI: Export button', () => {
    test('AC#3: "↓ .md" export button visible when document is open', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Export Folder');
      await createDocument(adminToken, 'Export Test Doc', folderId);

      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByText('Export Folder').click();
      await page.waitForTimeout(500);
      await page.getByText('Export Test Doc').click();
      await page.waitForTimeout(1000);

      await expect(page.getByTestId('export-document')).toBeVisible();
    });

    test('AC#3: clicking export button triggers file download with .md filename', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Download Folder');
      await createDocument(adminToken, 'Mi Documento', folderId);

      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByText('Download Folder').click();
      await page.waitForTimeout(500);
      await page.getByText('Mi Documento').click();
      await page.waitForTimeout(1000);

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('export-document').click(),
      ]);

      expect(download.suggestedFilename()).toBe('Mi Documento.md');
    });
  });
});
