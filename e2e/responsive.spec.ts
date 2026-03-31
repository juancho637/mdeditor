import { test, expect } from '@playwright/test';
import {
  API_URL,
  resetAndSeedUsers,
  createFolder,
  createDocument,
} from './helpers/api';

async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
) {
  await page.goto('/sign-in');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL('/dashboard');
}

// ---------------------------------------------------------------------------
// Story 8-3: Experiencia Responsive Completa
// ---------------------------------------------------------------------------

test.describe('Story 8-3: Experiencia Responsive Completa', () => {
  // -------------------------------------------------------------------------
  // AC#1 — Mobile sidebar: hamburger button + Sheet overlay
  // -------------------------------------------------------------------------
  test.describe('UI: Mobile sidebar — hamburger + Sheet', () => {
    test('AC#1: hamburger button visible only on mobile, hidden on desktop', async ({
      page,
    }) => {
      await resetAndSeedUsers();
      await page.setViewportSize({ width: 375, height: 812 });
      await loginAs(page, 'admin@test.com', 'password123');

      // Mobile width: hamburger visible
      await expect(page.getByTestId('mobile-menu-btn')).toBeVisible();

      // Desktop width: hamburger hidden
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(page.getByTestId('mobile-menu-btn')).not.toBeVisible();
    });

    test('AC#1: clicking hamburger opens sidebar Sheet overlay on mobile', async ({
      page,
    }) => {
      await resetAndSeedUsers();
      await page.setViewportSize({ width: 375, height: 812 });
      await loginAs(page, 'admin@test.com', 'password123');

      await page.getByTestId('mobile-menu-btn').click();

      // Sheet overlay should appear with navigation
      await expect(
        page.getByRole('navigation', { name: 'Carpetas' }),
      ).toBeVisible();
    });

    test('AC#1: selecting a folder in mobile sidebar closes the Sheet', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'MobileCloseFolder');

      await page.setViewportSize({ width: 375, height: 812 });
      await loginAs(page, 'admin@test.com', 'password123');

      // Open sidebar
      await page.getByTestId('mobile-menu-btn').click();
      await expect(
        page.getByRole('navigation', { name: 'Carpetas' }),
      ).toBeVisible();

      // Click folder — should close Sheet
      await page.getByRole('treeitem', { name: 'MobileCloseFolder' }).click();

      // Wait for Sheet to close (navigation inside Sheet disappears)
      await expect(
        page.locator('[data-radix-dialog-content]'),
      ).not.toBeVisible();
    });

    test('AC#1: skip link present in dashboard', async ({ page }) => {
      await resetAndSeedUsers();
      await loginAs(page, 'admin@test.com', 'password123');

      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeAttached();
      await expect(page.locator('#main-content')).toBeAttached();
    });

    test('AC#1: Fail path — hamburger absent on settings page (no sidebar)', async ({
      page,
    }) => {
      await resetAndSeedUsers();
      await page.setViewportSize({ width: 375, height: 812 });
      await loginAs(page, 'admin@test.com', 'password123');
      await page.goto('/settings/users');

      // No hamburger on settings pages
      await expect(page.getByTestId('mobile-menu-btn')).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC#2, AC#5 — Hybrid mode: Tabs on mobile/tablet portrait (< 1024px)
  // -------------------------------------------------------------------------
  test.describe('UI: Hybrid mode — Tabs on mobile', () => {
    test('AC#2: hybrid mode shows Editor/Preview tabs on mobile (< 1024px)', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'HybridFolder');
      await createDocument(adminToken, 'HybridDoc', folderId);

      // Navigate at desktop viewport so mode-hybrid button is accessible
      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByRole('treeitem', { name: 'HybridFolder' }).click();
      await page.getByText('HybridDoc').click();
      await page.getByTestId('mode-hybrid').click();

      // Shrink to mobile — hybrid-tabs-mobile should now be visible
      await page.setViewportSize({ width: 375, height: 812 });

      // Mobile Tabs should be visible
      await expect(page.getByTestId('hybrid-tabs-mobile')).toBeVisible();
      await expect(page.getByTestId('hybrid-tab-editor')).toBeVisible();
      await expect(page.getByTestId('hybrid-tab-preview')).toBeVisible();
    });

    test('AC#2: switching tabs in hybrid mode shows editor/preview on mobile', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'TabSwitchFolder');
      await createDocument(adminToken, 'TabSwitchDoc', folderId);

      // Navigate at desktop viewport so mode-hybrid button is accessible
      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByRole('treeitem', { name: 'TabSwitchFolder' }).click();
      await page.getByText('TabSwitchDoc').click();
      await page.getByTestId('mode-hybrid').click();

      // Shrink to mobile
      await page.setViewportSize({ width: 375, height: 812 });

      // Both tabs should be present in the tab list
      const tabList = page.getByTestId('hybrid-tabs-mobile');
      await expect(tabList.getByTestId('hybrid-tab-editor')).toBeVisible();
      await expect(tabList.getByTestId('hybrid-tab-preview')).toBeVisible();

      // Click Preview tab — tab trigger should now be selected
      await page.getByTestId('hybrid-tab-preview').click();
      await expect(page.getByTestId('hybrid-tab-preview')).toHaveAttribute(
        'data-state',
        'active',
      );
    });

    test('AC#4: hybrid mode shows SplitView on desktop (≥ 1024px), no tabs', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'DesktopSplitFolder');
      await createDocument(adminToken, 'DesktopSplitDoc', folderId);

      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAs(page, 'admin@test.com', 'password123');

      await page.getByRole('treeitem', { name: 'DesktopSplitFolder' }).click();
      await page.getByText('DesktopSplitDoc').click();
      await page.getByTestId('mode-hybrid').click();

      // Mobile tabs should NOT be present on desktop
      await expect(page.getByTestId('hybrid-tabs-mobile')).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC#3 — Toolbar: fixed bottom on mobile with 44px touch targets
  // -------------------------------------------------------------------------
  test.describe('UI: Mobile toolbar — fixed bottom with touch targets', () => {
    test('AC#3: toolbar visible when editing on mobile', async ({ page }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'ToolbarFolder');
      await createDocument(adminToken, 'ToolbarDoc', folderId);

      // Navigate at desktop so mode-editor is accessible (default is Hybrid)
      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByRole('treeitem', { name: 'ToolbarFolder' }).click();
      await page.getByText('ToolbarDoc').click();
      await page.getByTestId('mode-editor').click();

      // Shrink to mobile — mode-tabs-mobile visible (mode is Editor, not Hybrid)
      await page.setViewportSize({ width: 375, height: 812 });

      await expect(page.getByTestId('markdown-toolbar')).toBeVisible();
    });

    test('AC#3: toolbar buttons have minimum 44px touch target on mobile', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'TouchTargetFolder');
      await createDocument(adminToken, 'TouchTargetDoc', folderId);

      // Navigate at desktop so mode-editor is accessible (default is Hybrid)
      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByRole('treeitem', { name: 'TouchTargetFolder' }).click();
      await page.getByText('TouchTargetDoc').click();
      await page.getByTestId('mode-editor').click();

      // Shrink to mobile
      await page.setViewportSize({ width: 375, height: 812 });

      const boldBtn = page.getByTestId('toolbar-bold');
      await boldBtn.waitFor();
      const box = await boldBtn.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    });

    test('AC#3: Fail path — toolbar NOT visible in preview mode', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'NoToolbarFolder');
      await createDocument(adminToken, 'NoToolbarDoc', folderId);

      // Navigate at desktop so mode-preview is accessible (default is Hybrid)
      await loginAs(page, 'admin@test.com', 'password123');
      await page.getByRole('treeitem', { name: 'NoToolbarFolder' }).click();
      await page.getByText('NoToolbarDoc').click();
      await page.getByTestId('mode-preview').click();

      // Shrink to mobile
      await page.setViewportSize({ width: 375, height: 812 });

      await expect(page.getByTestId('markdown-toolbar')).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC#7 — Long press folder to open context menu (mobile)
  // -------------------------------------------------------------------------
  test.describe('UI: Long press folder context menu', () => {
    test('AC#7: long press on folder reveals context menu', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'LongPressFolder');

      await page.setViewportSize({ width: 375, height: 812 });
      await loginAs(page, 'admin@test.com', 'password123');

      await page.getByTestId('mobile-menu-btn').click();

      const folderItem = page.getByRole('treeitem', {
        name: 'LongPressFolder',
      });
      await folderItem.waitFor();
      const box = await folderItem.boundingBox();
      if (!box) throw new Error('FolderItem bounding box not found');

      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      // Simulate long press: touchstart, wait 600ms, touchend
      await page.evaluate(
        ({ cx, cy }) => {
          const el = document.elementFromPoint(cx, cy);
          if (!el) return;
          el.dispatchEvent(
            new TouchEvent('touchstart', {
              bubbles: true,
              touches: [
                new Touch({
                  identifier: 1,
                  target: el,
                  clientX: cx,
                  clientY: cy,
                }),
              ],
            }),
          );
        },
        { cx: x, cy: y },
      );

      await page.waitForTimeout(600);

      await page.evaluate(
        ({ cx, cy }) => {
          const el = document.elementFromPoint(cx, cy);
          if (!el) return;
          el.dispatchEvent(
            new TouchEvent('touchend', {
              bubbles: true,
              changedTouches: [
                new Touch({
                  identifier: 1,
                  target: el,
                  clientX: cx,
                  clientY: cy,
                }),
              ],
            }),
          );
        },
        { cx: x, cy: y },
      );

      // Context menu should appear
      await expect(page.getByText('Renombrar')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC#8 — Swipe left document to reveal delete button
  // -------------------------------------------------------------------------
  test.describe('UI: Swipe left document to delete', () => {
    test('AC#8: swipe left reveals delete action button', async ({ page }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'SwipeFolder');
      const docId = await createDocument(adminToken, 'SwipeDoc', folderId);

      await page.setViewportSize({ width: 375, height: 812 });
      await loginAs(page, 'admin@test.com', 'password123');

      await page.getByTestId('mobile-menu-btn').click();
      await page.getByRole('treeitem', { name: 'SwipeFolder' }).click();

      await expect(page.getByText('SwipeDoc')).toBeVisible();

      // Locate the doc row container
      const deleteBtn = page.getByTestId(`delete-swipe-${docId}`);
      const rowContainer = deleteBtn.locator('..');
      const box = await rowContainer.boundingBox();
      if (!box) throw new Error('Doc row container not found');

      const startX = box.x + box.width - 20;
      const endX = box.x + box.width - 20 - 100;
      const y = box.y + box.height / 2;

      // Simulate swipe left via TouchEvents
      await page.evaluate(
        ({ sx, sy, ex }) => {
          const el = document.elementFromPoint(sx, sy);
          if (!el) return;
          el.dispatchEvent(
            new TouchEvent('touchstart', {
              bubbles: true,
              touches: [
                new Touch({
                  identifier: 1,
                  target: el,
                  clientX: sx,
                  clientY: sy,
                }),
              ],
            }),
          );
          el.dispatchEvent(
            new TouchEvent('touchend', {
              bubbles: true,
              changedTouches: [
                new Touch({
                  identifier: 1,
                  target: el,
                  clientX: ex,
                  clientY: sy,
                }),
              ],
            }),
          );
        },
        { sx: startX, sy: y, ex: endX },
      );

      // Delete button should become visible
      await expect(deleteBtn).toBeVisible();
    });

    test('AC#8: swipe right dismisses the revealed delete button', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      const folderId = await createFolder(adminToken, 'SwipeResetFolder');
      const docId = await createDocument(adminToken, 'SwipeResetDoc', folderId);

      await page.setViewportSize({ width: 375, height: 812 });
      await loginAs(page, 'admin@test.com', 'password123');

      await page.getByTestId('mobile-menu-btn').click();
      await page.getByRole('treeitem', { name: 'SwipeResetFolder' }).click();
      await expect(page.getByText('SwipeResetDoc')).toBeVisible();

      const deleteBtn = page.getByTestId(`delete-swipe-${docId}`);
      const rowContainer = deleteBtn.locator('..');
      const box = await rowContainer.boundingBox();
      if (!box) throw new Error('Doc row container not found');

      const centerX = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      // Swipe left to reveal
      await page.evaluate(
        ({ sx, sy, ex }) => {
          const el = document.elementFromPoint(sx, sy);
          if (!el) return;
          el.dispatchEvent(
            new TouchEvent('touchstart', {
              bubbles: true,
              touches: [
                new Touch({
                  identifier: 1,
                  target: el,
                  clientX: sx,
                  clientY: sy,
                }),
              ],
            }),
          );
          el.dispatchEvent(
            new TouchEvent('touchend', {
              bubbles: true,
              changedTouches: [
                new Touch({
                  identifier: 1,
                  target: el,
                  clientX: ex,
                  clientY: sy,
                }),
              ],
            }),
          );
        },
        { sx: centerX + 50, sy: y, ex: centerX - 50 },
      );

      await expect(deleteBtn).toBeVisible();

      // Swipe right to dismiss
      await page.evaluate(
        ({ sx, sy, ex }) => {
          const el = document.elementFromPoint(sx, sy);
          if (!el) return;
          el.dispatchEvent(
            new TouchEvent('touchstart', {
              bubbles: true,
              touches: [
                new Touch({
                  identifier: 1,
                  target: el,
                  clientX: sx,
                  clientY: sy,
                }),
              ],
            }),
          );
          el.dispatchEvent(
            new TouchEvent('touchend', {
              bubbles: true,
              changedTouches: [
                new Touch({
                  identifier: 1,
                  target: el,
                  clientX: ex,
                  clientY: sy,
                }),
              ],
            }),
          );
        },
        { sx: centerX - 50, sy: y, ex: centerX + 50 },
      );

      await expect(deleteBtn).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // AC#9 — Accessibility: ARIA labels, focus rings, semantic HTML
  // -------------------------------------------------------------------------
  test.describe('UI: Accessibility', () => {
    test('AC#9: folder sidebar has navigation role with ARIA label on desktop', async ({
      page,
    }) => {
      await resetAndSeedUsers();
      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAs(page, 'admin@test.com', 'password123');

      await expect(
        page.getByRole('navigation', { name: 'Carpetas' }),
      ).toBeVisible();
    });

    test('AC#9: folder tree items have treeitem role', async ({ page }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'A11yFolder');

      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAs(page, 'admin@test.com', 'password123');

      await expect(
        page.getByRole('treeitem', { name: 'A11yFolder' }),
      ).toBeVisible();
    });

    test('AC#9: folder treeitem responds to keyboard Enter', async ({
      page,
    }) => {
      const adminToken = await resetAndSeedUsers();
      await createFolder(adminToken, 'KeyboardFolder');

      await page.setViewportSize({ width: 1280, height: 800 });
      await loginAs(page, 'admin@test.com', 'password123');

      const folderItem = page.getByRole('treeitem', { name: 'KeyboardFolder' });
      await folderItem.focus();
      await folderItem.press('Enter');

      // Folder should be selected (breadcrumb appears)
      await expect(
        page.getByText('KeyboardFolder', { exact: false }),
      ).toBeVisible();
    });

    test('AC#9: header Settings link and Salir button have focus-visible ring classes', async ({
      page,
    }) => {
      await resetAndSeedUsers();
      await loginAs(page, 'admin@test.com', 'password123');

      const settingsLink = page.getByRole('link', { name: 'Configuración' });
      await expect(settingsLink).toHaveClass(/focus-visible:ring-2/);

      const logoutBtn = page.getByRole('button', { name: 'Salir' });
      await expect(logoutBtn).toHaveClass(/focus-visible:ring-2/);
    });
  });
});
