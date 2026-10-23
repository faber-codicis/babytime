import { expect, test } from '@playwright/test';
import { openApp, seed } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const NOW = at(21, 14, 20);

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW });
  await openApp(page, '/#/verlauf');
});

test('empty history and the tab bar', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Verlauf', level: 1 })).toBeVisible();
  await expect(page.getByText('Hier erscheint alles, was du einträgst.')).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
  await expect(nav.getByRole('link', { name: 'Verlauf' })).toHaveAttribute('aria-current', 'page');

  await nav.getByRole('link', { name: 'Heute' }).click();
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Heute' })).toHaveAttribute('aria-current', 'page');
});

test('groups by day, newest first, with titles from the spec', async ({ page }) => {
  await seed(page, [
    { type: 'feed', side: 'left', start: at(21, 12, 22), end: at(21, 12, 40) },
    { type: 'diaper', diaper: 'wet', start: at(21, 13, 45), note: 'etwas gerötet' },
    { type: 'sleep', start: at(21, 13, 55) },
    { type: 'sleep', start: at(20, 9, 0), end: at(20, 11, 10) },
    { type: 'feed', side: 'right', start: at(19, 7, 0), end: at(19, 7, 15) },
  ]);

  await expect(page.locator('.day-title')).toHaveText(['Heute', 'Gestern', 'Mo, 19. Okt.']);
  const today = page.getByRole('region', { name: 'Heute' });
  await expect(today.locator('.event-title')).toHaveText(['Schlaf · läuft', 'Windel nass', 'Stillen links · 18 Min']);
  await expect(today.getByText('etwas gerötet')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Gestern' }).locator('.event-title')).toHaveText(['Schlaf · 2 Std 10 Min']);
  await page.screenshot({ path: 'test-results/history.png', animations: 'disabled' });
});

test('fix a wrong entry in 2 taps from the history: change the side', async ({ page }) => {
  await seed(page, [{ type: 'feed', side: 'left', start: at(21, 12, 22), end: at(21, 12, 40) }]);

  await page.getByRole('button', { name: /Stillen links · 18 Min/ }).click(); // 1
  const sheet = page.getByRole('dialog', { name: 'Eintrag bearbeiten' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByLabel('Beginn')).toHaveValue('2026-10-21T12:22');
  await expect(sheet.getByLabel('Ende')).toHaveValue('2026-10-21T12:40');
  await page.screenshot({ path: 'test-results/editor.png', animations: 'disabled' });

  await sheet.getByRole('button', { name: 'Rechts' }).click();
  await sheet.getByRole('button', { name: 'Speichern' }).click(); // 2 (+ side)
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('button', { name: /Stillen rechts · 18 Min/ })).toBeVisible();
  await expect(page.getByText('Eintrag gespeichert')).toBeVisible();
});

test('end before start shows an error at the field and saves nothing', async ({ page }) => {
  await seed(page, [{ type: 'sleep', start: at(21, 9, 0), end: at(21, 10, 0) }]);
  await page.getByRole('button', { name: /Schlaf · 1 Std/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Eintrag bearbeiten' });
  await sheet.getByLabel('Ende').fill('2026-10-21T08:30');
  await sheet.getByRole('button', { name: 'Speichern' }).click();

  await expect(sheet.getByText('Das Ende darf nicht vor dem Beginn liegen.')).toBeVisible();
  await expect(sheet.getByLabel('Ende')).toHaveAttribute('aria-invalid', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Schlaf · 1 Std/ })).toBeVisible();
});

test('delete asks first, then removes; undo brings it back', async ({ page }) => {
  await seed(page, [{ type: 'diaper', diaper: 'dirty', start: at(21, 13, 0) }]);
  await page.getByRole('button', { name: /Windel voll/ }).click(); // 1
  const sheet = page.getByRole('dialog', { name: 'Eintrag bearbeiten' });
  await sheet.getByRole('button', { name: 'Löschen' }).click(); // 2
  await expect(sheet.getByText('Diesen Eintrag wirklich löschen?')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Behalten' })).toBeFocused();
  await sheet.getByRole('button', { name: 'Ja, löschen' }).click(); // 3

  await expect(sheet).toBeHidden();
  await expect(page.getByText('Hier erscheint alles, was du einträgst.')).toBeVisible();
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('button', { name: /Windel voll/ })).toBeVisible();
});

test('backfill: "+" with type choice, start prefilled with now', async ({ page }) => {
  await page.getByRole('button', { name: 'Eintrag nachtragen' }).click();
  const sheet = page.getByRole('dialog', { name: 'Eintrag nachtragen' });
  await expect(sheet.getByLabel('Beginn')).toHaveValue('2026-10-21T14:20');

  await sheet.getByRole('button', { name: 'Schlaf' }).click();
  await sheet.getByLabel('Beginn').fill('2026-10-21T10:00');
  await sheet.getByLabel('Ende').fill('2026-10-21T11:30');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('button', { name: /Schlaf · 1 Std 30 Min/ })).toBeVisible();

  // Diaper: no end field, kind choice instead of side.
  await page.getByRole('button', { name: 'Eintrag nachtragen' }).click();
  await sheet.getByRole('button', { name: 'Windel' }).click();
  await expect(sheet.getByLabel('Ende')).toHaveCount(0);
  await expect(sheet.getByLabel('Zeitpunkt')).toBeVisible();
  await sheet.getByRole('button', { name: 'Beides' }).click();
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('button', { name: /Windel beides/ })).toBeVisible();

  // The new sleep also counts on Today.
  await page.getByRole('link', { name: 'Heute' }).click();
  await expect(page.getByRole('listitem').nth(2)).toHaveText('1 Std 30 Min Schlaf');
});

test('touch targets in history and edit sheet are at least 44 px', async ({ page }) => {
  await seed(page, [{ type: 'feed', side: 'left', start: at(21, 12, 22), end: at(21, 12, 40) }]);
  const check = async () => {
    // The hidden file input (aria-hidden, opened via "Daten wiederherstellen") is no touch target.
    for (const target of await page.locator(':is(button, a, input):visible:not([aria-hidden="true"])').all()) {
      const box = await target.boundingBox();
      const name = await target.evaluate((el) => `${el.tagName} ${el.getAttribute('aria-label') ?? el.textContent ?? ''} ${el.getAttribute('type') ?? ''}`);
      expect(box!.height, name).toBeGreaterThanOrEqual(44);
      expect(box!.width, name).toBeGreaterThanOrEqual(44);
    }
  };
  await check();
  await page.getByRole('button', { name: /Stillen links/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await check();
});
