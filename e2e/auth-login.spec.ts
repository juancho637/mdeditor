import { test, expect } from '@playwright/test';
import { resetUsers, postSetup, postSignIn, postRefresh } from './helpers/api';

test.describe('Story 1-2: Login y Gestión de Sesión', () => {
  // UI tests run FIRST to avoid rate limiting from API tests
  // (all tests share the same IP: localhost)

  // ─── UI Tests ────────────────────────────────────────────────

  test.describe('UI: Login Flow — Happy Path', () => {
    test.beforeEach(async () => {
      await resetUsers();
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
    });

    test('AC#1: Login with valid credentials redirects to dashboard', async ({ page }) => {
      await page.goto('/sign-in');

      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      const tokens = await page.evaluate(() => ({
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
        cookie: document.cookie,
      }));
      expect(tokens.access_token).toBeTruthy();
      expect(tokens.refresh_token).toBeTruthy();
      expect(tokens.cookie).toContain('access_token=');
    });

    test('Button shows loading state while submitting', async ({ page }) => {
      await page.goto('/sign-in');

      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');

      const button = page.getByRole('button', { name: 'Iniciar sesión' });
      await button.click();

      await expect(page.getByRole('button', { name: /Iniciando sesión/ })).toBeVisible();
    });
  });

  test.describe('UI: Login Flow — Inline Validation (Fail Path)', () => {
    test.beforeEach(async () => {
      await resetUsers();
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
    });

    test('Invalid email shows inline validation error on blur', async ({ page }) => {
      await page.goto('/sign-in');

      const emailInput = page.getByRole('textbox', { name: 'Email' });
      await emailInput.fill('not-an-email');
      await emailInput.blur();

      await expect(page.getByText('Email inválido')).toBeVisible();
    });

    test('Empty password shows inline validation error on blur', async ({ page }) => {
      await page.goto('/sign-in');

      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.focus();
      await passwordInput.blur();

      await expect(page.getByText('La contraseña es requerida')).toBeVisible();
    });

    test('Submit with all fields empty shows all validation errors', async ({ page }) => {
      await page.goto('/sign-in');

      await page.getByRole('button', { name: 'Iniciar sesión' }).click();

      await expect(page.getByText('El email es requerido')).toBeVisible();
      await expect(page.getByText('La contraseña es requerida')).toBeVisible();
    });

    test('Form fields are disabled during loading', async ({ page }) => {
      await page.goto('/sign-in');

      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');

      await page.getByRole('button', { name: 'Iniciar sesión' }).click();

      await expect(page.getByRole('textbox', { name: 'Email' })).toBeDisabled();
    });
  });

  test.describe('UI: Login Flow — Backend Errors', () => {
    test.beforeEach(async () => {
      await resetUsers();
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
    });

    test('AC#3: Wrong credentials show error message in the form', async ({ page }) => {
      await page.goto('/sign-in');

      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();

      // Error box should appear with the backend error message
      await expect(page.locator('[class*="bg-destructive"]')).toBeVisible({ timeout: 5_000 });
      await expect(page).toHaveURL(/\/sign-in/);
    });
  });

  test.describe('UI: Logout', () => {
    test.beforeEach(async () => {
      await resetUsers();
    });

    test('AC#4: Logout clears tokens and redirects to /sign-in', async ({ page }) => {
      await page.goto('/setup');
      await page.getByRole('textbox', { name: 'Nombre' }).fill('Admin');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.getByRole('textbox', { name: 'Contraseña' }).fill('password123');
      await page.getByRole('button', { name: 'Crear cuenta de administrador' }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

      await page.getByRole('button', { name: /salir|logout|cerrar/i }).click();
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5_000 });

      const tokens = await page.evaluate(() => ({
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
      }));
      expect(tokens.access_token).toBeNull();
      expect(tokens.refresh_token).toBeNull();
    });
  });

  // ─── API Tests (run after UI to avoid rate limiting UI tests) ──

  test.describe('API: Sign In', () => {
    test.beforeEach(async () => {
      await resetUsers();
      await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
    });

    test('POST /api/auth/sign-in with valid credentials should return tokens', async () => {
      const res = await postSignIn({ email: 'admin@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.access_token).toBeTruthy();
      expect(json.data.refresh_token).toBeTruthy();
    });

    test('POST /api/auth/sign-in with wrong password should return 400 with AUT001', async () => {
      const res = await postSignIn({ email: 'admin@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code_error).toBe('AUT001');
      expect(json.message).toBe('Invalid credentials.');
    });

    test('POST /api/auth/sign-in with non-existent email should return 400 with AUT001 (same error)', async () => {
      const res = await postSignIn({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code_error).toBe('AUT001');
    });

    test('POST /api/auth/sign-in with empty body should return 400', async () => {
      const res = await fetch('http://localhost:3000/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  test.describe('API: Refresh Token', () => {
    test.beforeEach(async () => {
      await resetUsers();
    });

    test('POST /api/auth/refresh with valid refresh token should return new tokens', async () => {
      const setupRes = await postSetup({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
      const setupJson = await setupRes.json();
      const refreshToken = setupJson.data.refresh_token;

      const res = await postRefresh(refreshToken);

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.access_token).toBeTruthy();
      expect(json.data.refresh_token).toBeTruthy();
    });

    test('POST /api/auth/refresh with invalid token should return 401', async () => {
      const res = await postRefresh('invalid-token-here');

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code_error).toBe('AUT002');
    });

    test('POST /api/auth/refresh with empty body should return 400', async () => {
      const res = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });
});
