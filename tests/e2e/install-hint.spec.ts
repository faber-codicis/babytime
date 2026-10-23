import { expect, test } from '@playwright/test';
import pkg from '../../package.json' with { type: 'json' };
import { openApp, waitForApp } from './helpers';

/** Simulates iOS: `navigator.standalone` exists only there (false in a Safari tab, true from the home screen). */
const simulateIos = (standalone: boolean) => `Object.defineProperty(Navigator.prototype, 'standalone', { get: () => ${standalone} });`;

test('iOS Safari tab: steps show on the first start, stay closed once closed', async ({ page }) => {
  await page.addInitScript(simulateIos(false));
  await page.goto('/');
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Herzlichen Glückwunsch!' })).toBeVisible();

  const hint = page.getByRole('region', { name: 'Als App installieren' });
  await expect(hint).toBeVisible();
  await expect(hint.getByRole('listitem')).toHaveText([
    'Tippe auf •••',
    'Dann auf Teilen und „Zum Home-Bildschirm“',
    '„Als Web-App öffnen“ eingeschaltet lassen und auf „Hinzufügen“ tippen',
  ]);
  await page.screenshot({ path: 'test-results/install-hint.png', animations: 'disabled' });

  await hint.getByRole('button', { name: 'Hinweis schließen' }).click();
  await expect(hint).toBeHidden();
  await page.getByRole('button', { name: 'Ohne Namen fortfahren' }).click();
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(hint).toBeHidden();

  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(hint).toBeHidden();
});

test('iOS Safari tab: still shown on Today if not closed during the first start', async ({ page }) => {
  await page.addInitScript(simulateIos(false));
  await openApp(page);
  await expect(page.getByRole('region', { name: 'Als App installieren' })).toBeVisible();
});

test('installed on iOS (home screen): no hint', async ({ page }) => {
  await page.addInitScript(simulateIos(true));
  await page.goto('/');
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Herzlichen Glückwunsch!' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Als App installieren' })).toHaveCount(0);
});

test('Android Chrome: install button once Chrome offers installation', async ({ page }) => {
  await openApp(page);
  const hint = page.getByRole('region', { name: 'Als App installieren' });
  await expect(hint).toHaveCount(0);

  // What Chrome does when it considers the app installable.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & Record<string, unknown>;
    event['prompt'] = async () => {
      (window as unknown as Record<string, boolean>)['promptShown'] = true;
    };
    event['userChoice'] = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(event);
  });

  await expect(hint).toBeVisible();
  await expect(hint.getByRole('listitem')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/install-android.png', animations: 'disabled' });
  await hint.getByRole('button', { name: 'Installieren' }).click();
  expect(await page.evaluate(() => (window as unknown as Record<string, boolean>)['promptShown'])).toBe(true);
  await expect(hint).toHaveCount(0);
});

test('version pill is visible at the top of Today, not covered by the dock', async ({ page }) => {
  await openApp(page);
  const version = page.getByRole('button', { name: `Version ${pkg.version}, Details anzeigen` });
  await expect(version).toHaveText(`v${pkg.version}`);
  const box = (await version.boundingBox())!;
  const dock = (await page.getByRole('navigation', { name: 'Eintragen' }).boundingBox())!;
  expect(box.y + box.height).toBeLessThan(dock.y);
  expect(box.y).toBeLessThan(120);
});

test('Android / desktop: no hint', async ({ page }) => {
  await openApp(page);
  await expect(page.getByRole('region', { name: 'Als App installieren' })).toHaveCount(0);
});
