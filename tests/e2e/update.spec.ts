import { expect, test } from '@playwright/test';
import pkg from '../../package.json' with { type: 'json' };
import { openApp, openSettings, setKvAndRestart, waitForApp } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const popupName = `Neu in Version ${pkg.version}`;

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('no popup right after the first start, nor on a later restart', async ({ page }) => {
  await expect(page.getByRole('dialog', { name: popupName })).toHaveCount(0);
  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: popupName })).toHaveCount(0);
});

test('after an update the popup appears exactly once', async ({ page }) => {
  await setKvAndRestart(page, 'lastSeenVersion', '0.1.0');
  const popup = page.getByRole('dialog', { name: popupName });
  await expect(popup).toBeVisible();
  await expect(popup.getByText('Das hat sich geändert')).toBeVisible();
  await expect(popup.getByRole('listitem').first()).toBeVisible();
  // At most 5 news items; the guide's numbered steps (0.14.0) come on top.
  expect(await popup.locator('.news-list li').count()).toBeLessThanOrEqual(5);
  await expect(popup.getByText('So geht’s')).toBeVisible();
  await expect(popup.getByRole('button', { name: 'Alles klar' })).toBeFocused();
  await page.screenshot({ path: 'test-results/update-popup.png', animations: 'disabled' });

  await popup.getByRole('button', { name: 'Alles klar' }).click();
  await expect(popup).toBeHidden();
  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(popup).toHaveCount(0);
});

test('Escape also counts as seen', async ({ page }) => {
  await setKvAndRestart(page, 'lastSeenVersion', '0.1.0');
  const popup = page.getByRole('dialog', { name: popupName });
  await expect(popup).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popup).toBeHidden();
  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(popup).toHaveCount(0);
});

test('never over a running feed: shows when returning to Today', async ({ page }) => {
  await page.getByRole('button', { name: 'Stillen', exact: true }).click();
  await expect(page.getByText('Linke Seite')).toBeVisible();
  await setKvAndRestart(page, 'lastSeenVersion', '0.1.0', '/#/stillen');

  await expect(page.getByText('Linke Seite')).toBeVisible();
  await expect(page.getByRole('dialog', { name: popupName })).toHaveCount(0);

  await page.getByRole('button', { name: 'Zurück zu Heute' }).click();
  await expect(page.getByRole('dialog', { name: popupName })).toBeVisible();
});

test('"Alle Neuerungen ansehen" opens the changelog page', async ({ page }) => {
  await setKvAndRestart(page, 'lastSeenVersion', '0.1.0');
  await page.getByRole('dialog', { name: popupName }).getByRole('button', { name: 'Alle Neuerungen ansehen' }).click();
  await expect(page).toHaveURL(/#\/neu$/);
  await expect(page.getByRole('heading', { name: 'Was ist neu', level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: `Version ${pkg.version}` }).getByText('Aktuell')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/whatsnew.png', animations: 'disabled' });

  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: popupName })).toHaveCount(0);
});

test('"Was ist neu" is reachable from Einstellungen → Über die App', async ({ page }) => {
  await openSettings(page, 'Über die App');
  await page.getByRole('main').getByRole('link', { name: 'Was ist neu' }).click();
  await expect(page.getByRole('heading', { name: 'Was ist neu', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Über die App', level: 1 })).toBeVisible();
  // And from the sub page back to the overview.
  await page.getByRole('button', { name: 'Zurück zu den Einstellungen' }).click();
  await expect(page.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeVisible();
});
