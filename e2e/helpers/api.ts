const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function resetUsers(): Promise<void> {
  // Direct DB cleanup via API or docker exec
  const { execSync } = await import('child_process');
  execSync(
    `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "DELETE FROM users;"`,
    { cwd: process.cwd(), stdio: 'pipe' },
  );
}

export async function getSetupStatus(): Promise<{ setup_completed: boolean }> {
  const res = await fetch(`${API_URL}/api/auth/status`);
  const json = await res.json();
  return json.data;
}

export async function getHealth(): Promise<{ status: string; database: string }> {
  const res = await fetch(`${API_URL}/api/health`);
  const json = await res.json();
  return json.data;
}

export async function postSetup(data: {
  name: string;
  email: string;
  password: string;
}): Promise<Response> {
  return fetch(`${API_URL}/api/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function postSignIn(data: {
  email: string;
  password: string;
}): Promise<Response> {
  return fetch(`${API_URL}/api/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/** Extract Set-Cookie header from response for use in subsequent requests */
export function extractCookies(res: Response): string {
  return res.headers.getSetCookie?.().join('; ') ?? res.headers.get('set-cookie') ?? '';
}

export async function postRefreshWithCookie(cookies: string): Promise<Response> {
  return fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
    },
  });
}

export async function postLogout(cookies: string): Promise<Response> {
  return fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
    },
  });
}

// ─── Collaboration test helpers ─────────────────────────────────

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function getAdminToken(): Promise<string> {
  const res = await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
  const json = await res.json();
  return json.data.access_token;
}

export async function createSecondUser(adminToken: string): Promise<{ email: string; password: string; token: string }> {
  const email = 'user2@test.com';
  const password = 'password123';

  // Create invitation
  const inviteRes = await fetch(`${API_URL}/api/invitations`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({ email }),
  });
  const inviteJson = await inviteRes.json();
  const inviteToken = inviteJson.data.token;

  // Accept invitation
  await fetch(`${API_URL}/api/invitations/${inviteToken}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Usuario 2', password }),
  });

  // Sign in to get token
  const signInRes = await postSignIn({ email, password });
  const signInJson = await signInRes.json();

  return { email, password, token: signInJson.data.access_token };
}

export async function createFolder(token: string, name: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/folders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  return json.data.id;
}

export async function createDocument(token: string, title: string, folderId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/documents`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title, folder_id: folderId }),
  });
  const json = await res.json();
  return json.data.id;
}

export async function createGroup(token: string, name: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/groups`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  return json.data.id;
}

export async function addUserToGroup(token: string, groupId: string, userId: string): Promise<void> {
  await fetch(`${API_URL}/api/groups/${groupId}/users`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function setFolderPermission(token: string, folderId: string, groupId: string, level: string): Promise<void> {
  await fetch(`${API_URL}/api/permissions`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ folder_id: folderId, group_id: groupId, permission_level: level }),
  });
}

export async function getUserIdFromToken(token: string): Promise<string> {
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  return payload.sub;
}

/** Full setup: admin + user2 + folder + document + permissions. Returns everything needed for collab tests. */
export async function setupCollaborationTest(): Promise<{
  adminToken: string;
  user2Token: string;
  user2Email: string;
  folderId: string;
  documentId: string;
}> {
  const adminToken = await getAdminToken();
  const user2 = await createSecondUser(adminToken);
  const folderId = await createFolder(adminToken, 'Collab Folder');
  const documentId = await createDocument(adminToken, 'Collab Doc', folderId);

  // Give user2 edit permissions
  const groupId = await createGroup(adminToken, 'Editors');
  const user2Id = await getUserIdFromToken(user2.token);
  await addUserToGroup(adminToken, groupId, user2Id);
  await setFolderPermission(adminToken, folderId, groupId, 'edit');

  return { adminToken, user2Token: user2.token, user2Email: user2.email, folderId, documentId };
}

export async function resetCollaborationData(): Promise<void> {
  const { execSync } = await import('child_process');
  execSync(
    `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown -c "DELETE FROM document_snapshots; DELETE FROM document_updates; DELETE FROM documents; DELETE FROM folder_permissions; DELETE FROM user_groups; DELETE FROM groups; DELETE FROM invitations; DELETE FROM folders;"`,
    { cwd: process.cwd(), stdio: 'pipe' },
  );
}
