import { test, expect } from '@playwright/test';
import {
  API_URL,
  resetAndSeedUsers,
  createFolder,
  createDocument,
  querySQL,
  setFolderPermission,
  addUserToGroup,
  createGroup,
} from './helpers/api';

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function mcpHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${apiKey}`,
  };
}

async function createApiKey(adminToken: string, name: string): Promise<{ api_key: string; prefix: string; id: string }> {
  const res = await fetch(`${API_URL}/api/mcp/keys`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  return json.data;
}

async function updateDocumentContent(adminToken: string, docId: string, content: string): Promise<void> {
  await fetch(`${API_URL}/api/documents/${docId}`, {
    method: 'PUT',
    headers: authHeaders(adminToken),
    body: JSON.stringify({ content_markdown: content }),
  });
}

test.describe('Story 7-1: Servidor MCP con Operaciones de Lectura', () => {
  test.describe('API: API Key Management', () => {
    test('AC#5: POST /api/mcp/keys creates a new API key with mk_ prefix', async () => {
      const adminToken = await resetAndSeedUsers();
      const res = await fetch(`${API_URL}/api/mcp/keys`, {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: JSON.stringify({ name: 'Test Key' }),
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.api_key).toMatch(/^mk_/);
      expect(json.data.prefix).toMatch(/^mk_/);
      expect(json.data.name).toBe('Test Key');
      expect(json.data.id).toBeTruthy();
      expect(json.data.created_at).toBeTruthy();
    });

    test('AC#5: POST /api/mcp/keys without auth returns 401', async () => {
      const res = await fetch(`${API_URL}/api/mcp/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Key' }),
      });

      expect(res.status).toBe(401);
    });

    test('AC#5: POST /api/mcp/keys with empty name returns 400', async () => {
      const adminToken = await resetAndSeedUsers();
      const res = await fetch(`${API_URL}/api/mcp/keys`, {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: JSON.stringify({ name: '' }),
      });

      expect(res.status).toBe(400);
    });
  });

  test.describe('API: MCP Authentication', () => {
    test('AC#5: MCP endpoint with invalid API key returns 401', async () => {
      const res = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: mcpHeaders('mk_invalid-key-value'),
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
          id: 1,
        }),
      });

      expect(res.status).toBe(401);
    });

    test('AC#5: MCP endpoint without Authorization header returns 401', async () => {
      const res = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
          id: 1,
        }),
      });

      expect(res.status).toBe(401);
    });

    test('AC#5: MCP endpoint with revoked API key returns 401', async () => {
      const adminToken = await resetAndSeedUsers();
      const keyData = await createApiKey(adminToken, 'Revoke Test');

      // Revoke the key directly in DB
      querySQL(`UPDATE api_keys SET is_active = false WHERE id = '${keyData.id}';`);

      const res = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: mcpHeaders(keyData.api_key),
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
          id: 1,
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  test.describe('API: MCP Protocol', () => {
    test('AC#1-#3: MCP initialize handshake succeeds with valid API key', async () => {
      const adminToken = await resetAndSeedUsers();
      const keyData = await createApiKey(adminToken, 'MCP Test');

      const res = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: mcpHeaders(keyData.api_key),
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        }),
      });

      expect(res.status).toBe(200);
      const text = await res.text();
      // Streamable HTTP returns JSON-RPC response
      expect(text).toContain('result');
      expect(text).toContain('markdown-mcp');
    });

    test('AC#1: list_folders returns accessible folders for admin', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'MCP Test Folder');
      const keyData = await createApiKey(adminToken, 'Admin MCP Key');

      // Initialize session
      const initRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: mcpHeaders(keyData.api_key),
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
      const sessionId = initRes.headers.get('mcp-session-id');
      expect(sessionId).toBeTruthy();

      // Send initialized notification
      await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId! },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      });

      // Call list_folders tool
      const toolRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId! },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'list_folders', arguments: {} },
          id: 2,
        }),
      });

      expect(toolRes.status).toBe(200);
      const toolText = await toolRes.text();
      expect(toolText).toContain('MCP Test Folder');
      expect(toolText).toContain(folderId);
    });

    test('AC#2: list_documents returns documents in accessible folder', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Docs Folder');
      const docId = await createDocument(adminToken, 'Test Document', folderId);
      const keyData = await createApiKey(adminToken, 'Docs MCP Key');

      // Initialize session
      const initRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: mcpHeaders(keyData.api_key),
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
      const sessionId = initRes.headers.get('mcp-session-id')!;

      // Send initialized notification
      await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      });

      // Call list_documents tool
      const toolRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'list_documents', arguments: { folder_id: folderId } },
          id: 2,
        }),
      });

      expect(toolRes.status).toBe(200);
      const toolText = await toolRes.text();
      expect(toolText).toContain('Test Document');
      expect(toolText).toContain(docId);
    });

    test('AC#3: read_document returns full markdown content', async () => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'Read Folder');
      const docId = await createDocument(adminToken, 'Markdown Doc', folderId);
      await updateDocumentContent(adminToken, docId, '# Hello MCP\n\nThis is test content.');
      const keyData = await createApiKey(adminToken, 'Read MCP Key');

      // Initialize session
      const initRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: mcpHeaders(keyData.api_key),
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
      const sessionId = initRes.headers.get('mcp-session-id')!;

      await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      });

      // Call read_document tool
      const toolRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'read_document', arguments: { document_id: docId } },
          id: 2,
        }),
      });

      expect(toolRes.status).toBe(200);
      const toolText = await toolRes.text();
      expect(toolText).toContain('Hello MCP');
      expect(toolText).toContain('This is test content.');
    });

    test('AC#4: list_documents on folder without permission returns error', async () => {
      const adminToken = await resetAndSeedUsers();
      const restrictedFolderId = await createFolder(adminToken, 'Restricted');
      await createDocument(adminToken, 'Secret Doc', restrictedFolderId);

      // Create a non-admin user's API key
      const user2Id = querySQL("SELECT id FROM users WHERE email='user2@test.com';");
      // User2 has no permissions on "Restricted" folder

      // Create API key for user2 via sign-in
      const signInRes = await fetch(`${API_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user2@test.com', password: 'password123' }),
      });
      const signInJson = await signInRes.json();
      const user2Token = signInJson.data.access_token;

      const keyData = await createApiKey(user2Token, 'User2 MCP Key');

      // Initialize session
      const initRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: mcpHeaders(keyData.api_key),
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
      const sessionId = initRes.headers.get('mcp-session-id')!;

      await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      });

      // Call list_documents on restricted folder
      const toolRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'list_documents', arguments: { folder_id: restrictedFolderId } },
          id: 2,
        }),
      });

      expect(toolRes.status).toBe(200); // MCP protocol returns 200 with error in content
      const toolText = await toolRes.text();
      expect(toolText).toContain('isError');
    });

    test('AC#1: list_folders only returns folders user has access to', async () => {
      const adminToken = await resetAndSeedUsers();
      const publicFolderId = await createFolder(adminToken, 'Public Folder');
      const restrictedFolderId = await createFolder(adminToken, 'Restricted Folder');

      // Give user2 access only to public folder via group
      const groupId = querySQL("SELECT id FROM groups WHERE name='Editors' LIMIT 1;");
      await setFolderPermission(adminToken, publicFolderId, groupId, 'view');
      // No permission on restricted folder

      // Sign in as user2
      const signInRes = await fetch(`${API_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user2@test.com', password: 'password123' }),
      });
      const user2Token = (await signInRes.json()).data.access_token;
      const keyData = await createApiKey(user2Token, 'User2 Key');

      // Initialize MCP session
      const initRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: mcpHeaders(keyData.api_key),
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
      const sessionId = initRes.headers.get('mcp-session-id')!;

      await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      });

      // Call list_folders
      const toolRes = await fetch(`${API_URL}/api/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders(keyData.api_key), 'mcp-session-id': sessionId },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'list_folders', arguments: {} },
          id: 2,
        }),
      });

      expect(toolRes.status).toBe(200);
      const toolText = await toolRes.text();
      expect(toolText).toContain('Public Folder');
      expect(toolText).not.toContain('Restricted Folder');
    });
  });
});
