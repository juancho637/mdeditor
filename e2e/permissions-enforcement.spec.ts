import { test, expect } from '@playwright/test';
import { resetAndSeedUsers, postSignIn, API_URL, runSQL } from './helpers/api';

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function createInvitedUser(adminToken: string, email: string): Promise<{ userId: string; token: string }> {
  const invRes = await fetch(`${API_URL}/api/invitations`, {
    method: 'POST', headers: authHeaders(adminToken),
    body: JSON.stringify({ email }),
  });
  const invJson = await invRes.json();

  const acceptRes = await fetch(`${API_URL}/api/invitations/${invJson.data.token}/accept`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User', password: 'password123' }),
  });
  const acceptJson = await acceptRes.json();
  const userToken = acceptJson.data.access_token;
  const payload = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
  return { userId: payload.sub, token: userToken };
}

async function createFolder(token: string, name: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/folders`, {
    method: 'POST', headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  return json.data.id;
}

async function createGroup(token: string, name: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/groups`, {
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
  runSQL('DELETE FROM folder_permissions; DELETE FROM documents; DELETE FROM folders; DELETE FROM user_groups; DELETE FROM groups; DELETE FROM invitations;');
}

test.describe('Story 3-2: Enforcement de Permisos', () => {
  let adminToken: string;

  test.describe('API: Permission Enforcement', () => {
    test.beforeEach(async () => {
      await resetAll();
      adminToken = await resetAndSeedUsers();
    });

    test('AC#4: Admin can access any document regardless of permissions', async () => {

      const folderId = await createFolder(adminToken, 'Secret');
      const docId = await createDocument(adminToken, 'Confidential', folderId);

      // No permissions set, but admin can still access
      const res = await fetch(`${API_URL}/api/documents/${docId}`, {
        headers: authHeaders(adminToken),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.permission_level).toBe('edit');
    });

    test('AC#3: User without permission gets 403 on document access', async () => {

      const folderId = await createFolder(adminToken, 'Secret');
      const docId = await createDocument(adminToken, 'Confidential', folderId);

      // Create regular user (no group, no permissions)
      const { token: userToken } = await createInvitedUser(adminToken, 'nogroup@test.com');

      const res = await fetch(`${API_URL}/api/documents/${docId}`, {
        headers: authHeaders(userToken),
      });

      expect(res.status).toBe(403);
    });

    test('AC#1+#2: User with VIEW can read but not edit', async () => {

      const folderId = await createFolder(adminToken, 'Marketing');
      const docId = await createDocument(adminToken, 'Brief', folderId);
      const groupId = await createGroup(adminToken, 'Viewers');

      // Create user and add to group
      const { userId, token: userToken } = await createInvitedUser(adminToken, 'viewer@test.com');
      await fetch(`${API_URL}/api/groups/${groupId}/users`, {
        method: 'POST', headers: authHeaders(adminToken),
        body: JSON.stringify({ user_id: userId }),
      });

      // Assign VIEW permission
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(adminToken),
        body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: 'view' }),
      });

      // Can read
      const getRes = await fetch(`${API_URL}/api/documents/${docId}`, {
        headers: authHeaders(userToken),
      });
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.data.permission_level).toBe('view');

      // Cannot edit
      const putRes = await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT', headers: authHeaders(userToken),
        body: JSON.stringify({ content_markdown: 'hacked' }),
      });
      expect(putRes.status).toBe(403);
    });

    test('AC#5: Multiple groups — highest permission wins', async () => {

      const folderId = await createFolder(adminToken, 'Shared');
      const docId = await createDocument(adminToken, 'Doc', folderId);
      const viewGroup = await createGroup(adminToken, 'Viewers');
      const editGroup = await createGroup(adminToken, 'Writers');

      const { userId, token: userToken } = await createInvitedUser(adminToken, 'multi@test.com');

      // Add to both groups
      await fetch(`${API_URL}/api/groups/${viewGroup}/users`, {
        method: 'POST', headers: authHeaders(adminToken),
        body: JSON.stringify({ user_id: userId }),
      });
      await fetch(`${API_URL}/api/groups/${editGroup}/users`, {
        method: 'POST', headers: authHeaders(adminToken),
        body: JSON.stringify({ user_id: userId }),
      });

      // Assign VIEW from one group, EDIT from another
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(adminToken),
        body: JSON.stringify({ folder_id: folderId, group_id: viewGroup, permission_level: 'view' }),
      });
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(adminToken),
        body: JSON.stringify({ folder_id: folderId, group_id: editGroup, permission_level: 'edit' }),
      });

      // Should have EDIT (highest)
      const getRes = await fetch(`${API_URL}/api/documents/${docId}`, {
        headers: authHeaders(userToken),
      });
      expect(getRes.status).toBe(200);
      const json = await getRes.json();
      expect(json.data.permission_level).toBe('edit');

      // Can edit
      const putRes = await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT', headers: authHeaders(userToken),
        body: JSON.stringify({ content_markdown: '# Updated' }),
      });
      expect(putRes.status).toBe(200);
    });

    test('GET /api/permissions/me returns user effective permissions', async () => {

      const folder1 = await createFolder(adminToken, 'Folder1');
      const folder2 = await createFolder(adminToken, 'Folder2');
      const groupId = await createGroup(adminToken, 'Team');

      const { userId, token: userToken } = await createInvitedUser(adminToken, 'team@test.com');
      await fetch(`${API_URL}/api/groups/${groupId}/users`, {
        method: 'POST', headers: authHeaders(adminToken),
        body: JSON.stringify({ user_id: userId }),
      });

      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(adminToken),
        body: JSON.stringify({ folder_id: folder1, group_id: groupId, permission_level: 'edit' }),
      });
      await fetch(`${API_URL}/api/permissions`, {
        method: 'PUT', headers: authHeaders(adminToken),
        body: JSON.stringify({ folder_id: folder2, group_id: groupId, permission_level: 'view' }),
      });

      const res = await fetch(`${API_URL}/api/permissions/me`, {
        headers: authHeaders(userToken),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data[folder1]).toBe('edit');
      expect(json.data[folder2]).toBe('view');
    });
  });
});
