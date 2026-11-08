import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

const feedButton = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Stillen', exact: true });

test('feed with side switch in 3 taps; next side is the opposite of the last side', async ({ page }) => {
  await feedButton(page).click(); // 1
  await expect(page).toHaveURL(/#\/stillen$/);
  await expect(page.getByRole('heading', { name: 'Stillen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Links' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Linke Seite')).toBeVisible();

  await page.getByRole('button', { name: 'Rechts' }).click(); // 2
  await expect(page.getByText('Rechte Seite')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rechts' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Fertig' }).click(); // 3
  await expect(page).not.toHaveURL(/stillen/);
  await expect(page.getByText(/^rechts · /)).toBeVisible();
  await expect(page.getByText('Nächste Seite: links')).toBeAttached();
  await expect(page.getByRole('listitem').first()).toHaveText('1× gestillt');
});

test('a running feed survives an app restart', async ({ page }) => {
  await feedButton(page).click();
  await expect(page.getByText('Linke Seite')).toBeVisible();
  await page.screenshot({ path: 'test-results/feeding.png', animations: 'disabled' });

  await page.goto('/');
  await expect(page.locator('#splash')).toHaveCount(0);
  await expect(page.getByText('Stillt gerade')).toBeVisible();
  // While feeding, Today shows the side being fed (not "Nächste Seite") and the dock leads back.
  await expect(page.getByText('Seite gerade: links')).toBeAttached();
  await expect(page.getByText('Nächste Seite: links')).toHaveCount(0);
  await expect(feedButton(page)).toHaveCount(0);
  await page.getByRole('button', { name: /^Stillen läuft, \d\d:\d\d, zum Timer$/ }).click();
  await expect(page.getByText('Linke Seite')).toBeVisible();
  await page.goto('/');
  await page.getByRole('link', { name: /Stillt gerade/ }).click();
  await expect(page.getByText('Linke Seite')).toBeVisible();
});

test('the feeding screen shows the time per side after a switch', async ({ page }) => {
  await page.clock.install();
  await feedButton(page).click();
  await page.clock.fastForward('02:00');
  await page.getByRole('button', { name: 'Rechts' }).click();
  await page.clock.fastForward('01:00');
  const times = page.getByRole('definition');
  await expect(times.first()).toHaveText(/^02:0\d$/);
  await expect(times.nth(1)).toHaveText(/^01:0\d$/);
});

test('cancel asks first, then discards the running feed', async ({ page }) => {
  await feedButton(page).click();
  await page.getByRole('button', { name: 'Abbrechen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Stillen abbrechen?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Weiter stillen' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Linke Seite')).toBeVisible();

  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await dialog.getByRole('button', { name: 'Verwerfen' }).click();
  await expect(page).not.toHaveURL(/stillen/);
  await expect(page.getByText('Noch nichts eingetragen')).toBeVisible();
});

test('diaper a little earlier: "vor 15" saves 15 minutes back, the next opening starts at "jetzt" again', async ({ page }) => {
  await page.getByRole('button', { name: 'Windel', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Windel' });
  await expect(sheet.getByRole('button', { name: 'jetzt' })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('button', { name: 'vor 15 Minuten' }).click();
  await sheet.getByRole('button', { name: 'Voll' }).click();
  await expect(page.getByText('Windel gespeichert · vor 15 Min')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Windel' })).toContainText(/vor 1[45] Min/); // the card refreshes every 30 s

  await page.getByRole('button', { name: 'Windel', exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'jetzt' })).toHaveAttribute('aria-pressed', 'true');
});

test('diaper in 2 taps, with undo', async ({ page }) => {
  await page.getByRole('button', { name: 'Windel', exact: true }).click(); // 1
  const sheet = page.getByRole('dialog', { name: 'Windel' });
  await expect(sheet).toBeVisible();
  await page.screenshot({ path: 'test-results/diaper-sheet.png', animations: 'disabled' });
  await sheet.getByRole('button', { name: 'Nass' }).click(); // 2

  await expect(sheet).toBeHidden();
  await expect(page.getByText('Windel gespeichert')).toBeVisible();
  await expect(page.getByText('gerade eben')).toBeVisible();
  await expect(page.getByRole('listitem').nth(1)).toHaveText('1 Windel');

  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('listitem').nth(1)).toHaveText('0 Windeln');
  await expect(page.getByText('Windel gespeichert')).toBeHidden();
});

test('diaper sheet closes with a tap outside and with Escape, saving nothing', async ({ page }) => {
  const open = page.getByRole('button', { name: 'Windel', exact: true });
  const sheet = page.getByRole('dialog', { name: 'Windel' });

  await open.click();
  await expect(sheet).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(sheet).toBeHidden();
  await expect(open).toBeFocused();

  await open.click();
  await expect(sheet).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('listitem').nth(1)).toHaveText('0 Windeln');
});

test('sleep in 1 tap, and undo after "Wach" keeps the sleep running', async ({ page }) => {
  await page.getByRole('button', { name: 'Schlaf', exact: true }).click();
  await expect(page.getByText('Schlaf gestartet')).toBeVisible();
  await page.getByRole('button', { name: 'Wach', exact: true }).click();
  await expect(page.getByText('Schlaf beendet')).toBeVisible();
  await page.screenshot({ path: 'test-results/snackbar.png', animations: 'disabled' });

  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('button', { name: 'Wach', exact: true })).toBeVisible();
  await expect(page.getByText('schläft gerade')).toBeVisible();
});

test('the snackbar disappears after 6 seconds', async ({ page }) => {
  await page.clock.install();
  await page.reload();
  await expect(page.locator('#splash')).toHaveCount(0);
  await page.getByRole('button', { name: 'Schlaf', exact: true }).click();
  await expect(page.getByText('Schlaf gestartet')).toBeVisible();
  // Let the frame run in which Preact starts the snackbar timer (WebKit fakes requestAnimationFrame too).
  await page.clock.runFor(100);
  await page.clock.fastForward(5_300);
  await expect(page.getByText('Schlaf gestartet')).toBeVisible();
  await page.clock.fastForward(1_000);
  await expect(page.getByText('Schlaf gestartet')).toBeHidden();
});
