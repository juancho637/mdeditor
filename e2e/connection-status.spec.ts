import { test, expect } from '@playwright/test';
import {
  resetCollaborationData,
  setupCollaborationTest,
} from './helpers/api';

/**
 * Track all WebSocket instances so we can close them,
 * and provide a mechanism to block/unblock new connections.
 */
async function addWebSocketTracking(page: any) {
  await page.addInitScript(() => {
    const origWS = window.WebSocket;
    (window as any).__wsInstances = [] as WebSocket[];
    (window as any).__origWS = origWS;
    (window as any).__wsBlocked = false;

    const patchedWS = function (...args: any[]) {
      if ((window as any).__wsBlocked) {
        // Connect to a port that doesn't exist to guarantee failure
        const ws = new origWS('ws://127.0.0.1:1/__blocked');
        (window as any).__wsInstances.push(ws);
        return ws;
      }
      const ws = new origWS(...(args as [string, ...any[]]));
      (window as any).__wsInstances.push(ws);
      return ws;
    } as any;
    patchedWS.prototype = origWS.prototype;
    patchedWS.CONNECTING = origWS.CONNECTING;
    patchedWS.OPEN = origWS.OPEN;
    patchedWS.CLOSING = origWS.CLOSING;
    patchedWS.CLOSED = origWS.CLOSED;
    window.WebSocket = patchedWS;
  });
}

/**
 * Simulate disconnection: block new WS connections, then close existing ones.
 */
async function simulateDisconnection(page: any) {
  await page.evaluate(() => {
    // Block future WebSocket connections
    (window as any).__wsBlocked = true;

    // Close all open WebSocket connections
    const instances = (window as any).__wsInstances || [];
    for (const ws of instances) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
  });
}

/**
 * Restore WebSocket connections by unblocking.
 */
async function restoreConnection(page: any) {
  await page.evaluate(() => {
    (window as any).__wsBlocked = false;
  });
}

test.describe('Story 5-3: Reconexión Automática y Estado de Conexión', () => {

  test.describe('UI: Connection Indicator', () => {
    test.beforeEach(async () => {
      await resetCollaborationData();
    });

    test('AC#4: Connection indicator appears in header when collaboration is active', async ({ browser }) => {
      test.setTimeout(60000);
      await setupCollaborationTest();

      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');
      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();

      await page.locator('.cm-editor').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(3000);

      const indicator = page.locator('[data-testid="connection-indicator"]');
      await expect(indicator).toBeVisible({ timeout: 10000 });

      await context.close();
    });

    test('AC#4: Connection indicator has green color when connected', async ({ browser }) => {
      test.setTimeout(60000);
      await setupCollaborationTest();

      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');
      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();

      await page.locator('.cm-editor').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(3000);

      const indicator = page.locator('[data-testid="connection-indicator"]');
      await expect(indicator).toBeVisible({ timeout: 10000 });

      // Verify green color (connected state) — #22c55e = rgb(34, 197, 94)
      const bgColor = await indicator.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bgColor).toBe('rgb(34, 197, 94)');

      await context.close();
    });
  });

  test.describe('UI: Connection Banner — Reconnection Flow', () => {
    test.beforeEach(async () => {
      await resetCollaborationData();
    });

    test('AC#1+AC#2: Disconnection shows reconnecting banner, reconnection shows connected banner', async ({ browser }) => {
      test.setTimeout(90000);
      await setupCollaborationTest();

      const context = await browser.newContext();
      const page = await context.newPage();
      await addWebSocketTracking(page);

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');
      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();

      await page.locator('.cm-editor').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Verify connected state
      await expect(page.locator('[data-testid="connection-indicator"]')).toBeVisible({ timeout: 10000 });

      // Simulate disconnection
      await simulateDisconnection(page);

      // Should show reconnecting banner
      const reconnectingBanner = page.locator('[data-testid="connection-banner-reconnecting"]');
      await expect(reconnectingBanner).toBeVisible({ timeout: 15000 });
      await expect(reconnectingBanner).toContainText('Reconectando');

      // User should still be able to type in editor while disconnected (AC#1)
      await page.locator('.cm-content').click();
      await page.keyboard.type('offline edit');

      // Restore WebSocket to allow reconnection
      await restoreConnection(page);

      // Wait for reconnection — green "Conectado ✓" banner should appear
      const reconnectedBanner = page.locator('[data-testid="connection-banner-reconnected"]');
      await expect(reconnectedBanner).toBeVisible({ timeout: 30000 });
      await expect(reconnectedBanner).toContainText('Conectado');

      // Banner should auto-dismiss after 3 seconds
      await expect(reconnectedBanner).not.toBeVisible({ timeout: 6000 });

      await context.close();
    });

    test('AC#3: Extended disconnection (>10s) shows offline banner', async ({ browser }) => {
      test.setTimeout(90000);
      await setupCollaborationTest();

      const context = await browser.newContext();
      const page = await context.newPage();
      await addWebSocketTracking(page);

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');
      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();

      await page.locator('.cm-editor').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Simulate disconnection
      await simulateDisconnection(page);

      // First: reconnecting banner
      const reconnectingBanner = page.locator('[data-testid="connection-banner-reconnecting"]');
      await expect(reconnectingBanner).toBeVisible({ timeout: 15000 });

      // Wait >10s for transition to offline state
      await page.waitForTimeout(12000);

      // Should now show offline banner
      const offlineBanner = page.locator('[data-testid="connection-banner-offline"]');
      await expect(offlineBanner).toBeVisible({ timeout: 5000 });
      await expect(offlineBanner).toContainText('Sin conexión');

      // Restore connection
      await restoreConnection(page);

      // Should eventually show connected banner
      const reconnectedBanner = page.locator('[data-testid="connection-banner-reconnected"]');
      await expect(reconnectedBanner).toBeVisible({ timeout: 30000 });

      await context.close();
    });
  });

  test.describe('UI: Accessibility', () => {
    test.beforeEach(async () => {
      await resetCollaborationData();
    });

    test('AC#1: Banner has proper ARIA attributes for screen readers', async ({ browser }) => {
      test.setTimeout(90000);
      await setupCollaborationTest();

      const context = await browser.newContext();
      const page = await context.newPage();
      await addWebSocketTracking(page);

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');
      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();

      await page.locator('.cm-editor').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Simulate disconnection to trigger banner
      await simulateDisconnection(page);

      const banner = page.locator('[data-testid="connection-banner-reconnecting"]');
      await expect(banner).toBeVisible({ timeout: 15000 });

      // Verify ARIA attributes
      await expect(banner).toHaveAttribute('role', 'status');
      await expect(banner).toHaveAttribute('aria-live', 'polite');

      // Restore connection
      await restoreConnection(page);

      await context.close();
    });
  });

  test.describe('UI: No Banner in Stable State', () => {
    test.beforeEach(async () => {
      await resetCollaborationData();
    });

    test('AC#4: No disconnection banner when stably connected', async ({ browser }) => {
      test.setTimeout(60000);
      await setupCollaborationTest();

      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/sign-in');
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@test.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: 'Iniciar sesión' }).click();
      await page.waitForURL('/dashboard');
      await page.getByText('Collab Folder').click();
      await page.getByText('Collab Doc').click();

      await page.locator('.cm-editor').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(5000);

      // Connection indicator should be visible
      await expect(page.locator('[data-testid="connection-indicator"]')).toBeVisible({ timeout: 10000 });

      // No banners should be visible in stable connected state
      await expect(page.locator('[data-testid="connection-banner-reconnecting"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="connection-banner-offline"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="connection-banner-reconnected"]')).not.toBeVisible();

      await context.close();
    });
  });
});
