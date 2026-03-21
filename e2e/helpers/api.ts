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
