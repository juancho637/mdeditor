// Detect if running inside Docker (container has /.dockerenv or /app mount)
const IS_DOCKER = (() => {
  try {
    const fs = require('fs');
    return fs.existsSync('/.dockerenv') || fs.existsSync('/app/package.json');
  } catch {
    return false;
  }
})();

export const API_URL = process.env.API_URL ?? (IS_DOCKER ? 'http://api:3000' : 'http://localhost:3000');

const PSQL_PREFIX = IS_DOCKER
  ? 'PGPASSWORD=markdown_secret psql -h postgres -U markdown -d markdown'
  : 'docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U markdown -d markdown';

/** Run a SQL command against the database. Works both inside Docker and on the host. */
export function runSQL(sql: string, opts?: { encoding?: 'utf8' }): string {
  const { execSync } = require('child_process');
  return execSync(`${PSQL_PREFIX} -c "${sql}"`, {
    cwd: process.cwd(),
    stdio: opts?.encoding ? 'pipe' : 'pipe',
    encoding: opts?.encoding,
  }) as string;
}

/** Run a SQL query and return trimmed text output. */
export function querySQL(sql: string): string {
  const { execSync } = require('child_process');
  return (execSync(`${PSQL_PREFIX} -t -c "${sql}"`, {
    cwd: process.cwd(),
    encoding: 'utf8',
  }) as string).trim();
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ─── Core auth helpers ──────────────────────────────────────────

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

export function extractCookies(res: Response): string {
  return res.headers.getSetCookie?.().join('; ') ?? res.headers.get('set-cookie') ?? '';
}

export async function postRefreshWithCookie(cookies: string): Promise<Response> {
  return fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookies },
  });
}

export async function postLogout(cookies: string): Promise<Response> {
  return fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookies },
  });
}

// ─── User & token helpers ───────────────────────────────────────

/** Creates admin via setup (fresh DB) or signs in (existing admin). */
export async function getAdminToken(): Promise<string> {
  // Try setup first — works on fresh DB and doesn't hit login throttle
  const setupRes = await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
  const setupJson = await setupRes.json();
  if (setupJson.data?.access_token) return setupJson.data.access_token;

  // Admin already exists — sign in
  const signInRes = await postSignIn({ email: 'admin@test.com', password: 'password123' });
  const signInJson = await signInRes.json();
  if (signInJson.data?.access_token) return signInJson.data.access_token;

  // Throttled — wait and retry once
  await new Promise((r) => setTimeout(r, 2000));
  const retryRes = await postSignIn({ email: 'admin@test.com', password: 'password123' });
  const retryJson = await retryRes.json();
  return retryJson.data.access_token;
}

export async function getUserIdFromToken(token: string): Promise<string> {
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  return payload.sub;
}

// ─── Reset helpers ──────────────────────────────────────────────

/** Deletes all users from the database. */
export async function resetUsers(): Promise<void> {
  runSQL('DELETE FROM users;');
}

/**
 * Full reset + seed: deletes everything, creates admin + user2 with "Editors" group.
 * Returns admin token (from postSetup, no sign-in needed — avoids throttle).
 */
export async function resetAndSeedUsers(): Promise<string> {
  // Clean all tables
  runSQL('DELETE FROM api_keys; DELETE FROM document_snapshots; DELETE FROM document_updates; DELETE FROM documents; DELETE FROM folder_permissions; DELETE FROM user_groups; DELETE FROM groups; DELETE FROM invitations; DELETE FROM folders; DELETE FROM users;');
  // Note: @nestjs/throttler uses in-memory storage. Redis FLUSHALL doesn't reset it.
  // Throttle limit is 30/min which is enough for the test suite.

  // Create admin via setup (returns token directly, no sign-in)
  const adminToken = await getAdminToken();

  // Create user2 via invitation (no sign-in needed)
  const inviteRes = await fetch(`${API_URL}/api/invitations`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({ email: 'user2@test.com' }),
  });
  const inviteJson = await inviteRes.json();

  await fetch(`${API_URL}/api/invitations/${inviteJson.data.token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Usuario 2', password: 'password123' }),
  });

  // Get user2 ID from DB (avoids sign-in)
  const user2Id = querySQL("SELECT id FROM users WHERE email='user2@test.com';");

  // Create "Editors" group and add user2
  const groupRes = await fetch(`${API_URL}/api/groups`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({ name: 'Editors' }),
  });
  const groupJson = await groupRes.json();

  await fetch(`${API_URL}/api/groups/${groupJson.data.id}/users`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({ user_id: user2Id }),
  });

  return adminToken;
}

export async function resetCollaborationData(): Promise<void> {
  runSQL('DELETE FROM api_keys; DELETE FROM document_snapshots; DELETE FROM document_updates; DELETE FROM documents; DELETE FROM folder_permissions; DELETE FROM user_groups; DELETE FROM groups; DELETE FROM invitations; DELETE FROM folders;');
}

// ─── CRUD helpers ───────────────────────────────────────────────

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

export async function grantUser2EditPermission(adminToken: string, folderId: string): Promise<void> {
  const groupId = querySQL("SELECT id FROM groups WHERE name='Editors' LIMIT 1;");

  if (groupId) {
    await setFolderPermission(adminToken, folderId, groupId, 'edit');
  }
}

// ─── Collaboration test helpers ─────────────────────────────────

export async function setupCollaborationTest(): Promise<{
  adminToken: string;
  user2Email: string;
  folderId: string;
  documentId: string;
}> {
  const adminToken = await resetAndSeedUsers();
  const folderId = await createFolder(adminToken, 'Collab Folder');
  const documentId = await createDocument(adminToken, 'Collab Doc', folderId);
  await grantUser2EditPermission(adminToken, folderId);

  return { adminToken, user2Email: 'user2@test.com', folderId, documentId };
}
