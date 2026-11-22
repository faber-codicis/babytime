import { expect, test, type Page } from '@playwright/test';
import pkg from '../../package.json' with { type: 'json' };
import { openApp, openSettings, seed, setKvAndRestart, waitForApp } from './helpers';

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

  test('four tabs (Meilensteine on by default); a short overview in three groups (0.17.0)', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(nav.getByRole('link')).toHaveText(['Heute', 'Verlauf', 'Meilensteine', 'Einstellungen']);
    await nav.getByRole('link', { name: 'Einstellungen' }).click();
    await expect(nav.getByRole('link', { name: 'Einstellungen' })).toHaveAttribute('aria-current', 'page');

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 2 })).toHaveText(['Alltag', 'Anpassen', 'Hilfe und Info']);
    await expect(main.getByText('Dein Baby', { exact: true })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Erfassen 6 von 6 eingeschaltet' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Daten & Backup Noch keine Sicherung' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Darstellung Hell · Rosé · Zeitleiste an' })).toBeVisible();
    await expect(main.getByRole('link', { name: `Über die App Version ${pkg.version} · Datenschutz` })).toBeVisible();
    await expect(main.getByRole('combobox', { name: 'Sprache · Language' })).toHaveValue('auto');
    await expect(main.getByText('Deine Einträge bleiben auf diesem Handy.')).toBeVisible();
    // The overview fits on about one screen (it was about twelve before 0.17.0).
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(1400);

    // Each sub page has its heading, keeps the tab bar and goes back to the overview.
    for (const [row, first] of [
      ['Erfassen', 'Was möchtest du festhalten?'],
      ['Darstellung', 'Design'],
    ] as const) {
      await main.getByRole('link', { name: new RegExp(`^${row}`) }).click();
      await expect(page.getByRole('heading', { name: row, level: 1 })).toBeVisible();
      await expect(main.getByRole('heading', { level: 2 }).first()).toHaveText(first);
      await expect(nav.getByRole('link', { name: 'Einstellungen' })).toHaveAttribute('aria-current', 'page');
      await page.getByRole('button', { name: 'Zurück zu den Einstellungen' }).click();
      await expect(page.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeVisible();
    }
    await openSettings(page, 'Daten & Backup');
    await expect(main.getByRole('region', { name: 'Noch keine Sicherung' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Sicherung speichern' })).toBeVisible();
    await main.getByText('Mehr', { exact: true }).click();
    await expect(main.getByText(/^Mit Passwort ist die Datei geschützt/)).toBeVisible();
    await openSettings(page, 'Über die App');
    await expect(main.getByText(`Baby Time ${pkg.version}`)).toBeVisible();
    await expect(main.getByText(/^Erstellt am \d{2}\.\d{2}\., \d{2}:\d{2}$/)).toBeVisible();
    // A sub page also opens directly by its address.
    await page.goto('/#/einstellungen/darstellung');
    await waitForApp(page);
    await expect(page.getByRole('heading', { name: 'Darstellung', level: 1 })).toBeVisible();
    // The ⓘ "Daten und Info" button in the history is gone.
    await nav.getByRole('link', { name: 'Verlauf' }).click();
    await expect(page.getByRole('button', { name: 'Daten und Info' })).toHaveCount(0);
  });

  test('feedback link, test-version and privacy notes (0.13.0)', async ({ page }) => {
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    const main = page.getByRole('main');
    const feedback = main.getByRole('link', { name: /^Feedback senden/ });
    await expect(feedback).toBeVisible();
    const href = (await feedback.getAttribute('href'))!;
    expect(href).toMatch(/^mailto:kontakt@mraz.app\?subject=/);
    const body = new URLSearchParams(href.slice(href.indexOf('?') + 1)).get('body')!;
    expect(body).toContain(`Version: ${pkg.version}`);
    expect(body).toContain('Als App installiert: nein');
    await openSettings(page, 'Über die App');
    await expect(main.getByText(/^Testversion:/)).toBeVisible();
    await expect(main.getByText(/ersetzt keinen Rat/)).toBeVisible();
    await expect(main.getByRole('button', { name: 'Datenschutz Kein Konto, kein Upload, keine Analyse' })).toBeVisible();
  });

  test('privacy policy opens from "Über die App" and closes again (0.16.1)', async ({ page }) => {
    await openSettings(page, 'Über die App');
    await page.getByRole('main').getByRole('button', { name: /^Datenschutz/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Datenschutz' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(/^Kurz gesagt: Deine Einträge verlassen dein Handy nicht/)).toBeVisible();
    await expect(sheet.getByText(/Kontakt: kontakt@mraz\.app$/)).toBeVisible();
    await expect(sheet.getByRole('heading', { name: 'Deine Rechte' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Schließen' })).toBeFocused();
    await page.screenshot({ path: 'test-results/privacy.png', animations: 'disabled' });
    await sheet.getByRole('button', { name: 'Schließen' }).click();
    await expect(sheet).toBeHidden();
  });

  test('screenshot and touch targets on the overview and every sub page', async ({ page }) => {
    await openSettings(page);
    await page.screenshot({ path: 'test-results/settings.png', animations: 'disabled', fullPage: true });
    await touchTargets(page);
    for (const [sub, file] of [
      ['Erfassen', 'trackers'],
      ['Darstellung', 'look'],
      ['Daten & Backup', 'data'],
      ['Über die App', 'about'],
    ] as const) {
      await openSettings(page, sub);
      await page.screenshot({ path: `test-results/settings-${file}.png`, animations: 'disabled', fullPage: true });
      await touchTargets(page);
    }
  });

  test('"Nach Update suchen": offline gives a clear message, online says up to date', async ({ page, context }) => {
    await openSettings(page, 'Über die App');
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
    await openSettings(page, 'Über die App');
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

test('language picker: one line, nothing cut off or wider than the phone, even with large text (0.15.1, 0.17.0)', async ({ page }) => {
  await openApp(page);
  await page.getByRole('link', { name: 'Einstellungen' }).click();
  for (const [width, zoom] of [[360, '1'], [412, '1.3'], [320, '1.3']] as const) {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate((z) => { document.documentElement.style.zoom = z; }, zoom);
    const picker = page.getByRole('main').getByRole('combobox', { name: 'Sprache · Language' });
    await picker.scrollIntoViewIfNeeded();
    const row = page.locator('#settings-language');
    const box = (await row.boundingBox())!;
    expect(box.x + box.width, `${width} px, zoom ${zoom}`).toBeLessThanOrEqual(width + 1);
    const pickerBox = (await picker.boundingBox())!;
    expect(pickerBox.x + pickerBox.width, `${width} px, zoom ${zoom}`).toBeLessThanOrEqual(box.x + box.width + 1);
  }
  await page.screenshot({ path: 'test-results/language-picker-large-text.png', animations: 'disabled' });
});
