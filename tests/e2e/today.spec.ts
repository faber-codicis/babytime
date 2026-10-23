import { expect, test, type Page } from '@playwright/test';
import { openApp, seed } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const at = (h: number, m = 0) => new Date(2026, 9, 21, h, m).getTime();
const NOW = at(14, 20); // Wednesday, as in the mockup

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW });
  await openApp(page);
});

test('empty state', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(page.getByText('Noch nichts eingetragen')).toBeVisible();
  await expect(page.getByText('Nächste Seite: links')).toBeAttached();
  await expect(page.getByRole('listitem')).toHaveText(['0× gestillt', '0 Windeln', '0 Min Schlaf']);
});

test('shows the mockup situation', async ({ page }) => {
  await seed(page, [
    { type: 'feed', side: 'left', start: at(1, 0), end: at(1, 15) },
    { type: 'feed', side: 'right', start: at(4, 10), end: at(4, 25) },
    { type: 'feed', side: 'left', start: at(6, 30), end: at(6, 45) },
    { type: 'feed', side: 'right', start: at(8, 40), end: at(8, 55) },
    { type: 'feed', side: 'left', start: at(10, 20), end: at(10, 30) },
    { type: 'feed', side: 'right', start: at(10, 30), end: at(10, 40) }, // side switch, same feeding
    { type: 'feed', side: 'right', start: at(12, 22), end: at(12, 40) },
    { type: 'diaper', diaper: 'wet', start: at(2, 0) },
    { type: 'diaper', diaper: 'dirty', start: at(5, 0) },
    { type: 'diaper', diaper: 'both', start: at(9, 0) },
    { type: 'diaper', diaper: 'wet', start: at(11, 0) },
    { type: 'diaper', diaper: 'wet', start: at(13, 45) },
    { type: 'sleep', start: at(0, 0), end: at(4, 0) },
    { type: 'sleep', start: at(5, 0), end: at(8, 30) },
    { type: 'sleep', start: at(9, 30), end: at(11, 0) },
    { type: 'sleep', start: at(13, 55) }, // running
  ]);

  await expect(page.getByText('Mittwoch, 14:20')).toBeVisible();
  await expect(page.getByText('1 Std 40 Min', { exact: true })).toBeVisible();
  await expect(page.getByText('rechts · 18 Minuten · um 12:40')).toBeVisible();
  await expect(page.getByText('Nächste Seite: links')).toBeAttached();
  await expect(page.getByText('vor 35 Min')).toBeVisible();
  await expect(page.getByText('nass', { exact: true })).toBeVisible();
  await expect(page.getByText('seit 25 Min')).toBeVisible();
  await expect(page.getByText('schläft gerade')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveText(['6× gestillt', '5 Windeln', '9 Std 25 Min Schlaf']);
  await expect(page.getByRole('button', { name: 'Wach' })).toBeVisible();
  await page.screenshot({ path: 'test-results/today.png', fullPage: true });

  // Stillen starts on the next side and shows the previous feeding, as in mockup "Stillen läuft".
  await page.getByRole('button', { name: 'Stillen', exact: true }).click();
  await expect(page.getByText('Linke Seite')).toBeVisible();
  await expect(page.getByText('gestartet um 14:20')).toBeVisible();
  await expect(page.getByText('Letztes Mal rechts · 18 Min · vor 1 Std 40 Min')).toBeVisible();
  await page.screenshot({ path: 'test-results/feeding-mockup.png', animations: 'disabled' });
});

test('sleep toggles with one tap', async ({ page }) => {
  await page.getByRole('button', { name: 'Schlaf' }).click();
  await expect(page.getByRole('button', { name: 'Wach' })).toBeVisible();
  await expect(page.getByText('schläft gerade')).toBeVisible();
  await page.getByRole('button', { name: 'Wach' }).click();
  await expect(page.getByRole('button', { name: 'Schlaf' })).toBeVisible();
  await expect(page.getByText('wach', { exact: true })).toBeVisible();
});

async function expectTouchTargets(page: Page) {
  for (const target of await page.locator('button:visible, a:visible').all()) {
    const box = await target.boundingBox();
    expect(box!.width, await target.innerText()).toBeGreaterThanOrEqual(44);
    expect(box!.height, await target.innerText()).toBeGreaterThanOrEqual(44);
  }
}

test('all touch targets are at least 44 px (Heute, Windel-Sheet, Stillen)', async ({ page }) => {
  await expectTouchTargets(page);

  await page.getByRole('button', { name: 'Windel', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Windel' })).toBeVisible();
  await expectTouchTargets(page);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Stillen', exact: true }).click();
  await expect(page.getByText('Linke Seite')).toBeVisible();
  await expectTouchTargets(page);
});
