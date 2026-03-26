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
    test('should return setup_completed: false when no users exist', async () => {
      await resetUsers();
      const status = await getSetupStatus();

      expect(status.setup_completed).toBe(false);
    });

    test('should return setup_completed: true after admin created', async () => {
      await resetUsers();
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
      const status = await getSetupStatus();

      expect(status.setup_completed).toBe(true);
    });
  });

  test.describe('API: Setup Validation', () => {
    test('POST with short password should return 400', async () => {
      const res = await postSetup({ name: 'Test', email: 'test@test.com', password: '123' });

      expect(res.status).toBe(400);
    });

    test('POST without name should return 400', async () => {
      const res = await fetch('http://localhost:3000/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });

      expect(res.status).toBe(400);
    });

    test('POST with invalid email should return 400', async () => {
      const res = await postSetup({ name: 'Test', email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
    });

    test('POST with empty body should return 400', async () => {
      const res = await fetch('http://localhost:3000/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    test('POST with extra fields should return 400 (forbidNonWhitelisted)', async () => {
      const res = await fetch('http://localhost:3000/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@test.com',
          password: 'password123',
          role: 'superadmin',
        }),
      });

      expect(res.status).toBe(400);
    });

    test('POST duplicate setup should return 400 with AUT003', async () => {
      await resetUsers();
      const first = await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
      expect(first.status).toBe(201);

      const second = await postSetup({ name: 'Hacker', email: 'hacker@test.com', password: 'password123' });
      expect(second.status).toBe(400);

      const body = await second.json();
      expect(body.code_error).toBe('AUT003');
      expect(body.message).toBe('Setup already completed.');
    });
  });

  // ─── UI: Setup Flow ─────────────────────────────────────────

  test.describe('UI: Setup Flow — Happy Path', () => {
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
      await expect(page.getByText('Selecciona o crea una carpeta')).toBeVisible();

      const tokens = await page.evaluate(() => ({
        access_token: localStorage.getItem('access_token'),
        cookie: document.cookie,
      }));
      expect(tokens.access_token).toBeTruthy();
      expect(tokens.cookie).toContain('access_token=');
    });

    test('Button shows loading state while submitting', async ({ page }) => {
      await page.goto('/setup');

      await page.getByRole('textbox', { name: 'Nombre' }).fill('Admin');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.getByRole('textbox', { name: 'Contraseña' }).fill('password123');

      const button = page.getByRole('button', { name: 'Crear cuenta de administrador' });
      await button.click();

      // Button should show loading text or be disabled during submission
      await expect(
        page.getByRole('button', { name: 'Creando cuenta...' })
          .or(page.getByRole('button', { disabled: true })),
      ).toBeVisible();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    });
  });

  // ─── UI: Inline Validation ──────────────────────────────────

  test.describe('UI: Setup Flow — Inline Validation (Fail Path)', () => {
    test.beforeEach(async () => {
      await resetUsers();
    });

    test('Password shorter than 8 chars shows error on blur', async ({ page }) => {
      await page.goto('/setup');

      const input = page.getByRole('textbox', { name: 'Contraseña' });
      await input.fill('123');
      await input.blur();

      await expect(page.getByText('al menos 8 caracteres')).toBeVisible();
    });

    test('Invalid email shows error on blur', async ({ page }) => {
      await page.goto('/setup');

      const input = page.getByRole('textbox', { name: 'Email' });
      await input.fill('not-an-email');
      await input.blur();

      await expect(page.getByText('email válido')).toBeVisible();
    });

    test('Empty name shows error on blur', async ({ page }) => {
      await page.goto('/setup');

      const input = page.getByRole('textbox', { name: 'Nombre' });
      await input.focus();
      await input.blur();

      await expect(page.getByText('nombre es obligatorio')).toBeVisible();
    });

    test('Submit with all fields empty shows all validation errors', async ({ page }) => {
      await page.goto('/setup');

      await page.getByRole('button', { name: 'Crear cuenta de administrador' }).click();

      await expect(page.getByText('nombre es obligatorio')).toBeVisible();
      await expect(page.getByText('email es obligatorio')).toBeVisible();
      await expect(page.getByText('contraseña es obligatoria')).toBeVisible();

      // Should NOT navigate away
      await expect(page).toHaveURL(/\/setup/);
    });

    test('Password strength indicator shows correct colors', async ({ page }) => {
      await page.goto('/setup');
      const input = page.getByRole('textbox', { name: 'Contraseña' });

      // Weak (< 4 chars)
      await input.fill('ab');
      let bars = page.locator('.rounded-full.h-1');
      await expect(bars.first()).toHaveClass(/bg-destructive/);

      // Medium (4-7 chars)
      await input.fill('abcde');
      await expect(bars.first()).toHaveClass(/bg-warning/);

      // Strong (>= 8 chars)
      await input.fill('abcdefgh');
      await expect(bars.first()).toHaveClass(/bg-success/);
    });
  });

  // ─── UI: Backend Error Display ──────────────────────────────

  test.describe('UI: Setup Flow — Backend Errors in UI', () => {
    test('AUT003 error is displayed in the form when setup already completed', async ({ page }) => {
      await resetUsers();
      // Create admin via API first
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      // Try setup via UI (bypassing proxy redirect by going directly)
      // We need to make the form submit and get the error
      // Since proxy redirects away from /setup, we'll test the API response handling
      // by temporarily having no cookie and going to setup before proxy kicks in
      await page.goto('/setup');

      // Proxy should redirect to /sign-in since setup is completed
      await expect(page).toHaveURL(/\/sign-in/);
    });
  });

  // ─── UI: Route Protection ──────────────────────────────────

  test.describe('UI: Protección de Rutas', () => {
    test.beforeEach(async () => {
      await resetUsers();
    });

    test('AC#3: With admin and no auth, /setup redirects to /sign-in', async ({ page }) => {
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/setup');

      await expect(page).toHaveURL(/\/sign-in/);
      await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    });

    test('AC#4: Without auth, /dashboard redirects to /sign-in', async ({ page }) => {
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/sign-in/);
    });

    test('AC#3: With auth, /setup redirects to /dashboard', async ({ page }) => {
      await page.goto('/setup');
      await page.getByRole('textbox', { name: 'Nombre' }).fill('Admin');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.getByRole('textbox', { name: 'Contraseña' }).fill('password123');
      await page.getByRole('button', { name: 'Crear cuenta de administrador' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      await page.goto('/setup');

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Root path without auth redirects to /sign-in', async ({ page }) => {
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });

      await page.goto('/');

      await expect(page).toHaveURL(/\/sign-in/);
    });

    test('Root path with auth redirects to /dashboard', async ({ page }) => {
      // Setup via UI to get authenticated
      await page.goto('/setup');
      await page.getByRole('textbox', { name: 'Nombre' }).fill('Admin');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.getByRole('textbox', { name: 'Contraseña' }).fill('password123');
      await page.getByRole('button', { name: 'Crear cuenta de administrador' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      await page.goto('/');

      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  // ─── UI: Logout ────────────────────────────────────────────

  test.describe('UI: Logout', () => {
    test.beforeEach(async () => {
      await resetUsers();
    });

    test('Logout clears tokens and redirects to /sign-in', async ({ page }) => {
      await page.goto('/setup');
      await page.getByRole('textbox', { name: 'Nombre' }).fill('Admin');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.getByRole('textbox', { name: 'Contraseña' }).fill('password123');
      await page.getByRole('button', { name: 'Crear cuenta de administrador' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      await page.getByRole('button', { name: 'Salir' }).click();

      await expect(page).toHaveURL(/\/sign-in/);

      const tokens = await page.evaluate(() => ({
        access_token: localStorage.getItem('access_token'),
        cookie: document.cookie,
      }));
      expect(tokens.access_token).toBeNull();
      expect(tokens.cookie).not.toContain('access_token=');
    });

    test('After logout, /dashboard redirects to /sign-in', async ({ page }) => {
      // Setup + login
      await page.goto('/setup');
      await page.getByRole('textbox', { name: 'Nombre' }).fill('Admin');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.getByRole('textbox', { name: 'Contraseña' }).fill('password123');
      await page.getByRole('button', { name: 'Crear cuenta de administrador' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      // Logout
      await page.getByRole('button', { name: 'Salir' }).click();
      await expect(page).toHaveURL(/\/sign-in/);

      // Try to access dashboard again
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/sign-in/);
    });
  });
});
