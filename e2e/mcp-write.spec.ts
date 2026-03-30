import { test, expect } from '@playwright/test';
import {
  API_URL,
  resetAndSeedUsers,
  createFolder,
  createDocument,
  querySQL,
  setFolderPermission,
} from './helpers/api';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function mcpHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${apiKey}`,
  };
}

async function createApiKey(
  token: string,
  name: string,
): Promise<{ api_key: string; prefix: string; id: string }> {
  const res = await fetch(`${API_URL}/api/mcp/keys`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  return json.data;
}

async function initMcpSession(apiKey: string): Promise<string> {
  const initRes = await fetch(`${API_URL}/api/mcp`, {
    method: 'POST',
    headers: mcpHeaders(apiKey),
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0' },
      },
      id: 1,
    }),
  });
  expect(initRes.status).toBe(200);
  const sessionId = initRes.headers.get('mcp-session-id')!;

  await fetch(`${API_URL}/api/mcp`, {
    method: 'POST',
    headers: { ...mcpHeaders(apiKey), 'mcp-session-id': sessionId },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
  });

  return sessionId;
}

async function callMcpTool(
  apiKey: string,
  sessionId: string,
  toolName: string,
  args: Record<string, unknown>,
  id = 2,
) {
  const res = await fetch(`${API_URL}/api/mcp`, {
    method: 'POST',
    headers: { ...mcpHeaders(apiKey), 'mcp-session-id': sessionId },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: toolName, arguments: args },
      id,
    }),
  });
  return res;
}

test.describe('Story 7-2: Operaciones de Escritura MCP', () => {
  test.describe('API: create_document', () => {
    test('AC#1: create_document creates a document in the specified folder', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'MCP Write Folder');
      const keyData = await createApiKey(adminToken, 'Write Key');
      const sessionId = await initMcpSession(keyData.api_key);

      const res = await callMcpTool(
        keyData.api_key,
        sessionId,
        'create_document',
        {
          folder_id: folderId,
          title: 'MCP Created Doc',
        },
      );

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('MCP Created Doc');
      expect(text).toContain('mcp-created-doc');
      expect(text).toContain(folderId);
      expect(text).not.toContain('isError');
    });

    test('AC#1: create_document with content sets initial markdown content', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Content Folder');
      const keyData = await createApiKey(adminToken, 'Content Key');
      const sessionId = await initMcpSession(keyData.api_key);

      const res = await callMcpTool(
        keyData.api_key,
        sessionId,
        'create_document',
        {
          folder_id: folderId,
          title: 'Doc With Content',
          content: '# Hello from MCP\n\nThis was created via MCP.',
        },
      );

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('Doc With Content');

      // Parse the created document ID from response (SSE format has escaped JSON)
      const resultMatch = text.match(/\\?"id\\?":\s*\\?"([^"\\]+)\\?"/);
      expect(resultMatch).toBeTruthy();
      const docId = resultMatch![1];

      // Verify content was set by reading via MCP
      const readRes = await callMcpTool(
        keyData.api_key,
        sessionId,
        'read_document',
        {
          document_id: docId,
        },
        3,
      );
      const readText = await readRes.text();
      expect(readText).toContain('Hello from MCP');
      expect(readText).toContain('This was created via MCP.');
    });

    test('AC#4: create_document without EDIT permission returns AKY002', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'View Only Folder');

      // Create group with VIEW permission and user2
      const groupId = querySQL(
        "SELECT id FROM groups WHERE name='Editors' LIMIT 1;",
      );
      await setFolderPermission(adminToken, folderId, groupId, 'view');

      // Sign in as user2
      const signInRes = await fetch(`${API_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user2@test.com',
          password: 'password123',
        }),
      });
      const user2Token = (await signInRes.json()).data.access_token;
      const keyData = await createApiKey(user2Token, 'User2 Write Key');
      const sessionId = await initMcpSession(keyData.api_key);

      const res = await callMcpTool(
        keyData.api_key,
        sessionId,
        'create_document',
        {
          folder_id: folderId,
          title: 'Should Fail',
        },
      );

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('AKY002');
      expect(text).toContain('isError');
    });

    test('AC#4: create_document without any permission returns AKY002', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'No Access Folder');
      // No permissions set for anyone

      const signInRes = await fetch(`${API_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user2@test.com',
          password: 'password123',
        }),
      });
      const user2Token = (await signInRes.json()).data.access_token;
      const keyData = await createApiKey(user2Token, 'No Access Key');
      const sessionId = await initMcpSession(keyData.api_key);

      const res = await callMcpTool(
        keyData.api_key,
        sessionId,
        'create_document',
        {
          folder_id: folderId,
          title: 'Should Fail',
        },
      );

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('AKY002');
      expect(text).toContain('isError');
    });
  });

  test.describe('API: edit_document', () => {
    test('AC#2: edit_document updates document content', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Edit Folder');
      const docId = await createDocument(adminToken, 'Edit Me', folderId);
      const keyData = await createApiKey(adminToken, 'Edit Key');
      const sessionId = await initMcpSession(keyData.api_key);

      const res = await callMcpTool(
        keyData.api_key,
        sessionId,
        'edit_document',
        {
          document_id: docId,
          content: '# Updated via MCP\n\nNew content here.',
        },
      );

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('updated');
      expect(text).toContain('true');
      expect(text).not.toContain('isError');

      // Verify content was updated by reading
      const readRes = await callMcpTool(
        keyData.api_key,
        sessionId,
        'read_document',
        {
          document_id: docId,
        },
        3,
      );
      const readText = await readRes.text();
      expect(readText).toContain('Updated via MCP');
      expect(readText).toContain('New content here.');
    });

    test('AC#3: edit_document registers change in history (author tracked)', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'History Folder');
      const docId = await createDocument(adminToken, 'History Doc', folderId);
      const keyData = await createApiKey(adminToken, 'History Key');
      const sessionId = await initMcpSession(keyData.api_key);

      await callMcpTool(keyData.api_key, sessionId, 'edit_document', {
        document_id: docId,
        content: '# Edited for history tracking',
      });

      // Check that a snapshot was persisted with the author (releaseDocument flushes snapshot)
      const adminId = querySQL(
        "SELECT id FROM users WHERE email='admin@test.com';",
      );
      const snapshotCount = querySQL(
        `SELECT COUNT(*) FROM document_snapshots WHERE document_id = '${docId}' AND author_id = '${adminId}';`,
      );
      expect(parseInt(snapshotCount)).toBeGreaterThan(0);
    });

    test('AC#5: edit_document with non-existent document returns AKY004', async () => {
      const adminToken = await resetAndSeedUsers();
      const keyData = await createApiKey(adminToken, 'NotFound Key');
      const sessionId = await initMcpSession(keyData.api_key);

      const res = await callMcpTool(
        keyData.api_key,
        sessionId,
        'edit_document',
        {
          document_id: '00000000-0000-0000-0000-000000000000',
          content: 'Should fail',
        },
      );

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('AKY004');
      expect(text).toContain('isError');
    });

    test('AC#4: edit_document without EDIT permission returns AKY002', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'View Only Edit');
      const docId = await createDocument(adminToken, 'Cannot Edit', folderId);

      // Give user2 VIEW permission only
      const groupId = querySQL(
        "SELECT id FROM groups WHERE name='Editors' LIMIT 1;",
      );
      await setFolderPermission(adminToken, folderId, groupId, 'view');

      const signInRes = await fetch(`${API_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user2@test.com',
          password: 'password123',
        }),
      });
      const user2Token = (await signInRes.json()).data.access_token;
      const keyData = await createApiKey(user2Token, 'View Only Key');
      const sessionId = await initMcpSession(keyData.api_key);

      const res = await callMcpTool(
        keyData.api_key,
        sessionId,
        'edit_document',
        {
          document_id: docId,
          content: 'Should fail',
        },
      );

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('AKY002');
      expect(text).toContain('isError');
    });

    test('AC#2: edit_document replaces content completely (not append)', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Replace Folder');
      const docId = await createDocument(adminToken, 'Replace Doc', folderId);
      const keyData = await createApiKey(adminToken, 'Replace Key');

      // Use a fresh session for each edit to avoid state leaking
      const sessionId1 = await initMcpSession(keyData.api_key);

      // First edit
      await callMcpTool(keyData.api_key, sessionId1, 'edit_document', {
        document_id: docId,
        content: 'First content',
      });

      // Second edit should replace, not append
      const sessionId2 = await initMcpSession(keyData.api_key);
      await callMcpTool(keyData.api_key, sessionId2, 'edit_document', {
        document_id: docId,
        content: 'Second content only',
      });

      // Read and verify only second content exists
      const sessionId3 = await initMcpSession(keyData.api_key);
      const readRes = await callMcpTool(
        keyData.api_key,
        sessionId3,
        'read_document',
        {
          document_id: docId,
        },
      );
      const readText = await readRes.text();
      expect(readText).toContain('Second content only');
      expect(readText).not.toContain('First content');
    });
  });
});
