import { test, expect } from '@playwright/test';
import { resetUsers, getSetupStatus, getHealth, postSetup } from './helpers/api';

test.describe('Story 1-1: Registro del Primer Administrador y Setup Inicial', () => {
  // ─── API Tests ───────────────────────────────────────────────

  test.describe('API: Health Check', () => {
    test('GET /api/health should return ok with database connected', async () => {
      const health = await getHealth();

      expect(health.status).toBe('ok');
      expect(health.database).toBe('connected');
    });
  });

  test.describe('API: Auth Status', () => {
    test('GET /api/auth/status should return setup_completed boolean', async () => {
      const status = await getSetupStatus();

      expect(typeof status.setup_completed).toBe('boolean');
    });
  });

  test.describe('API: Setup Validation', () => {
    test('POST /api/auth/setup with short password should return 400', async () => {
      const res = await postSetup({
        name: 'Test',
        email: 'test@test.com',
        password: '123',
      });

      expect(res.status).toBe(400);
    });

    test('POST /api/auth/setup without name should return 400', async () => {
      const res = await fetch('http://localhost:3000/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      expect(res.status).toBe(400);
    });

    test('POST /api/auth/setup with invalid email should return 400', async () => {
      const res = await postSetup({
        name: 'Test',
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
    });
  });

  // ─── UI Flow Tests ──────────────────────────────────────────

  test.describe('UI: Setup Flow Completo', () => {
    test.beforeEach(async () => {
      await resetUsers();
    });

    test('AC#1: Plataforma nueva redirige a /setup con formulario de registro', async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveURL(/\/setup/);
      await expect(page.getByRole('heading', { name: 'Configuración inicial' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Nombre' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Contraseña' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Crear cuenta de administrador' })).toBeVisible();
    });

    test('AC#2: Setup válido crea admin, genera tokens y redirige a dashboard con empty state', async ({ page }) => {
      await page.goto('/setup');

      await page.getByRole('textbox', { name: 'Nombre' }).fill('Juan David');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@markdown.com');
      await page.getByRole('textbox', { name: 'Contraseña' }).fill('password123');
      await page.getByRole('button', { name: 'Crear cuenta de administrador' }).click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
      await expect(page.getByRole('heading', { name: 'Bienvenido a markdown' })).toBeVisible();
      await expect(page.getByText('Crea tu primera carpeta')).toBeVisible();

      // Verify tokens were stored
      const tokens = await page.evaluate(() => ({
        access_token: localStorage.getItem('access_token'),
        cookie: document.cookie,
      }));
      expect(tokens.access_token).toBeTruthy();
      expect(tokens.cookie).toContain('access_token=');
    });

    test('AC#1: Validación inline al perder foco — contraseña mínimo 8 caracteres', async ({ page }) => {
      await page.goto('/setup');

      const passwordInput = page.getByRole('textbox', { name: 'Contraseña' });
      await passwordInput.fill('123');
      await passwordInput.blur();

      await expect(page.getByText('al menos 8 caracteres')).toBeVisible();
    });

    test('AC#1: Validación inline al perder foco — email inválido', async ({ page }) => {
      await page.goto('/setup');

      const emailInput = page.getByRole('textbox', { name: 'Email' });
      await emailInput.fill('not-an-email');
      await emailInput.blur();

      await expect(page.getByText('email válido')).toBeVisible();
    });

    test('AC#1: Validación inline al perder foco — nombre vacío', async ({ page }) => {
      await page.goto('/setup');

      const nameInput = page.getByRole('textbox', { name: 'Nombre' });
      await nameInput.focus();
      await nameInput.blur();

      await expect(page.getByText('nombre es obligatorio')).toBeVisible();
    });
  });

  test.describe('UI: Protección de Rutas', () => {
    test.beforeEach(async () => {
      await resetUsers();
    });

    test('AC#3: Con admin existente y sin auth, /setup redirige a /sign-in', async ({ page }) => {
      // Create admin first
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/setup');

      await expect(page).toHaveURL(/\/sign-in/);
      await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    });

    test('AC#4: Sin auth, /dashboard redirige a /sign-in', async ({ page }) => {
      // Create admin first so setup is completed
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/sign-in/);
    });

    test('AC#3: Con auth, /setup redirige a /dashboard', async ({ page }) => {
      // Do setup via UI to get authenticated
      await page.goto('/setup');
      await page.getByRole('textbox', { name: 'Nombre' }).fill('Admin');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.getByRole('textbox', { name: 'Contraseña' }).fill('password123');
      await page.getByRole('button', { name: 'Crear cuenta de administrador' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Now try to access /setup
      await page.goto('/setup');

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Ruta raíz sin auth redirige a /sign-in', async ({ page }) => {
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/');

      await expect(page).toHaveURL(/\/sign-in/);
    });
  });

  test.describe('UI: Setup duplicado', () => {
    test('AC#3: POST /api/auth/setup duplicado retorna AUT003', async () => {
      await resetUsers();
      // First setup
      const first = await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
      expect(first.status).toBe(201);

      // Second setup
      const second = await postSetup({ name: 'Hacker', email: 'hacker@test.com', password: 'password123' });
      expect(second.status).toBe(400);

      const body = await second.json();
      expect(body.code_error).toBe('AUT003');
      expect(body.message).toBe('Setup already completed.');
    });
  });

  test.describe('UI: Logout', () => {
    test('Logout limpia tokens y redirige a /sign-in', async ({ page }) => {
      await resetUsers();

      // Setup and get to dashboard
      await page.goto('/setup');
      await page.getByRole('textbox', { name: 'Nombre' }).fill('Admin');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.getByRole('textbox', { name: 'Contraseña' }).fill('password123');
      await page.getByRole('button', { name: 'Crear cuenta de administrador' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Logout
      await page.getByRole('button', { name: 'Salir' }).click();

      await expect(page).toHaveURL(/\/sign-in/);

      // Verify tokens cleared
      const tokens = await page.evaluate(() => ({
        access_token: localStorage.getItem('access_token'),
        cookie: document.cookie,
      }));
      expect(tokens.access_token).toBeNull();
      expect(tokens.cookie).not.toContain('access_token=');
    });
  });
});
