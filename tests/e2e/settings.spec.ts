import { expect, test, type Page } from '@playwright/test';
import pkg from '../../package.json' with { type: 'json' };
import { openApp, seed, setKvAndRestart, waitForApp } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 10, 20, 14, 20).getTime();

async function touchTargets(page: Page) {
  for (const target of await page.locator(':is(button, a, input):visible:not([aria-hidden="true"])').all()) {
    const box = (await target.boundingBox())!;
    const name = await target.evaluate((el) => el.getAttribute('aria-label') ?? el.textContent ?? el.tagName);
    expect(box.height, name).toBeGreaterThanOrEqual(44);
    expect(box.width, name).toBeGreaterThanOrEqual(44);
  }
}

test.describe('settings tab', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('three tabs; profile, look, data and about sections', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(nav.getByRole('link')).toHaveText(['Heute', 'Verlauf', 'Einstellungen']);
    await nav.getByRole('link', { name: 'Einstellungen' }).click();
    await expect(nav.getByRole('link', { name: 'Einstellungen' })).toHaveAttribute('aria-current', 'page');

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 2 })).toHaveText(['Darstellung', 'Daten', 'Über die App']);
    await expect(main.getByText('Dein Baby', { exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: /Daten exportieren Noch keine Sicherung/ })).toBeVisible();
    await expect(main.getByText(`Baby Time ${pkg.version}`)).toBeVisible();
    await expect(main.getByText(/^Erstellt am \d{2}\.\d{2}\., \d{2}:\d{2}$/)).toBeVisible();
    await expect(main.getByText('Deine Einträge bleiben auf diesem Handy.')).toBeVisible();
    // The ⓘ "Daten und Info" button in the history is gone.
    await nav.getByRole('link', { name: 'Verlauf' }).click();
    await expect(page.getByRole('button', { name: 'Daten und Info' })).toHaveCount(0);
  });

  test('screenshot and touch targets', async ({ page }) => {
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    await page.screenshot({ path: 'test-results/settings.png', animations: 'disabled', fullPage: true });
    await touchTargets(page);
  });

  test('"Nach Update suchen": offline gives a clear message, online says up to date', async ({ page, context }) => {
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    const main = page.getByRole('main');

    await context.setOffline(true);
    await main.getByRole('button', { name: 'Nach Update suchen' }).click();
    await expect(main.getByRole('status').filter({ hasText: 'Keine Verbindung' })).toBeVisible();

    await context.setOffline(false);
    await main.getByRole('button', { name: 'Nach Update suchen' }).click();
    await expect(main.getByText('Du hast die neueste Version.')).toBeVisible();
  });
});

test.describe('update pill on Today', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('nothing pending: no version pill on Today, version lives in Einstellungen', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Version / })).toHaveCount(0);
    await expect(page.getByText(`v${pkg.version}`)).toHaveCount(0);
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    await expect(page.getByText(`Baby Time ${pkg.version}`)).toBeVisible();
  });

  test('a new active version turns the pill into "Update bereit"; tapping restarts', async ({ page }) => {
    // The service worker controls the page after the first start; reload so that counts as "already installed".
    await page.reload();
    await waitForApp(page);
    await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));

    const ready = page.getByRole('button', { name: 'Neue Version bereit, jetzt neu starten' });
    await expect(ready).toHaveText('Update bereit');
    await page.screenshot({ path: 'test-results/version-ready.png', animations: 'disabled' });

    const box = (await ready.boundingBox())!;
    const dock = (await page.getByRole('navigation', { name: 'Eintragen' }).boundingBox())!;
    expect(box.y + box.height).toBeLessThan(dock.y);

    await ready.click();
    await waitForApp(page);
    await expect(ready).toHaveCount(0);
  });
});

test.describe('backup reminder on Today', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: NOW });
    await openApp(page);
  });

  const card = (page: Page) => page.getByRole('region', { name: 'Zeit für eine Sicherung' });

  test('not shown while all entries are younger than 14 days', async ({ page }) => {
    await seed(page, [{ type: 'diaper', diaper: 'wet', start: NOW - 3 * DAY }]);
    await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });

  test('after 14 days without backup; "Jetzt sichern" exports and the card goes away', async ({ page }) => {
    await seed(page, [{ type: 'diaper', diaper: 'wet', start: NOW - 20 * DAY }]);
    await expect(card(page)).toBeVisible();
    await expect(card(page).getByText('Noch keine Sicherung vorhanden.')).toBeVisible();
    await page.screenshot({ path: 'test-results/backup-reminder.png', animations: 'disabled' });

    const download = page.waitForEvent('download');
    await card(page).getByRole('button', { name: 'Jetzt sichern' }).click();
    await download;
    await expect(page.getByText('Sicherung erstellt')).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });

  test('closing keeps it away; it returns 14 days later', async ({ page }) => {
    await seed(page, [{ type: 'diaper', diaper: 'wet', start: NOW - 40 * DAY }]);
    await card(page).getByRole('button', { name: 'Erinnerung schließen' }).click();
    await expect(card(page)).toHaveCount(0);
    await page.reload();
    await waitForApp(page);
    await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
    await expect(card(page)).toHaveCount(0);

    await setKvAndRestart(page, 'backupReminderDismissedAt', NOW - 15 * DAY);
    await expect(card(page)).toBeVisible();
  });

  test('a backup older than 14 days says when it was', async ({ page }) => {
    await seed(page, [{ type: 'diaper', diaper: 'wet', start: NOW - 60 * DAY }]);
    await setKvAndRestart(page, 'lastExportAt', NOW - 16 * DAY);
    await expect(card(page).getByText('Letzte Sicherung vor 16 Tagen')).toBeVisible();
  });

  test('hidden while a feed is running', async ({ page }) => {
    await seed(page, [{ type: 'diaper', diaper: 'wet', start: NOW - 20 * DAY }]);
    await expect(card(page)).toBeVisible();
    await page.getByRole('button', { name: 'Stillen', exact: true }).click();
    await page.getByRole('button', { name: 'Zurück zu Heute' }).click();
    await expect(page.getByText('Stillt gerade')).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });
});
