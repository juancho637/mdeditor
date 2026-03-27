import { test, expect } from '@playwright/test';
import { resetAndSeedUsers } from './helpers/api';

const API_URL = 'http://localhost:3000';

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
  const { execSync } = await import('child_process');
  execSync(
    `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "DELETE FROM documents; DELETE FROM folders;"`,
    { cwd: process.cwd(), stdio: 'pipe' },
  );
}

test.describe('Story 2-3: Mover Documentos entre Carpetas', () => {
  let adminToken: string;

  test.describe('API: Move Document', () => {
    test.beforeEach(async () => {
      await resetAll();
      adminToken = await resetAndSeedUsers();
    });

    test('PATCH /api/documents/:id/move moves document to target folder', async () => {
      const token = adminToken;
      const folder1 = await createFolder(token, 'Source');
      const folder2 = await createFolder(token, 'Target');
      const docId = await createDocument(token, 'Brief', folder1);

      const res = await fetch(`${API_URL}/api/documents/${docId}/move`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folder2 }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.folder_id).toBe(folder2);

      // Verify document is in target folder
      const listRes = await fetch(`${API_URL}/api/folders/${folder2}/documents`, {
        headers: authHeaders(token),
      });
      const listJson = await listRes.json();
      expect(listJson.data.length).toBe(1);
      expect(listJson.data[0].title).toBe('Brief');

      // Verify source folder is empty
      const sourceRes = await fetch(`${API_URL}/api/folders/${folder1}/documents`, {
        headers: authHeaders(token),
      });
      const sourceJson = await sourceRes.json();
      expect(sourceJson.data.length).toBe(0);
    });

    test('PATCH /api/documents/:id/move to same folder returns DOC003', async () => {
      const token = adminToken;
      const folderId = await createFolder(token, 'Folder');
      const docId = await createDocument(token, 'Brief', folderId);

      const res = await fetch(`${API_URL}/api/documents/${docId}/move`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code_error).toBe('DOC003');
    });

    test('PATCH /api/documents/:id/move with nonexistent doc returns DOC001', async () => {
      const token = adminToken;
      const folderId = await createFolder(token, 'Target');

      const res = await fetch(`${API_URL}/api/documents/00000000-0000-0000-0000-000000000001/move`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ folder_id: folderId }),
      });

      expect(res.status).toBe(404);
    });

    test('PATCH /api/documents/:id/move with nonexistent target folder returns FLD001', async () => {
      const token = adminToken;
      const folderId = await createFolder(token, 'Source');
      const docId = await createDocument(token, 'Brief', folderId);

      const res = await fetch(`${API_URL}/api/documents/${docId}/move`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ folder_id: '00000000-0000-0000-0000-000000000000' }),
      });

      expect(res.status).toBe(404);
    });

    test('PATCH /api/documents/:id/move without auth returns 401', async () => {
      const res = await fetch(`${API_URL}/api/documents/some-id/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: 'some-folder' }),
      });
      expect(res.status).toBe(401);
    });
  });
});
