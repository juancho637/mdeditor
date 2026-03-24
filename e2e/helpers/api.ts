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
