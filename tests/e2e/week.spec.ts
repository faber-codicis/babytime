import { expect, test } from '@playwright/test';
import { openApp, seed } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const NOW = at(21, 14, 20); // Wednesday

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW });
  await openApp(page);
});

test('week view: bars per tracker, average per day, back to last week', async ({ page }) => {
  await seed(page, [
    { type: 'feed', side: 'left', start: at(19, 8), end: at(19, 8, 20) },
    { type: 'feed', side: 'right', start: at(20, 9), end: at(20, 9, 15) },
    { type: 'feed', side: 'left', start: at(20, 13), end: at(20, 13, 15) },
    { type: 'feed', side: 'right', start: at(21, 7), end: at(21, 7, 15) },
    { type: 'diaper', diaper: 'wet', start: at(21, 10) },
    { type: 'sleep', start: at(20, 22), end: at(21, 2) },
    { type: 'bottle', amountMl: 90, milk: 'breast', start: at(21, 12) } as never,
    { type: 'diaper', diaper: 'dirty', start: at(14, 10) }, // last week
  ]);
  await page.getByRole('link', { name: 'Verlauf' }).click();
  await page.getByRole('button', { name: 'Woche' }).click();

  await expect(page.getByRole('heading', { name: 'Diese Woche' })).toBeVisible();
  await expect(page.getByText('19.–25. Okt.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nächste Woche' })).toBeDisabled();

  const feeds = page.getByRole('region', { name: 'Stillen' });
  await expect(feeds.getByText('Ø 1,3 pro Tag')).toBeVisible();
  await expect(feeds.getByRole('listitem', { name: 'Di: 2× gestillt' })).toBeVisible();
  await expect(feeds.getByRole('listitem', { name: 'Do: noch nicht' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Schlaf' }).getByText('Ø 1 Std 20 Min pro Tag')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Flasche' }).getByRole('listitem', { name: 'Mi: 90 ml Flasche' })).toBeVisible();
  await page.screenshot({ path: 'test-results/week.png', fullPage: true, animations: 'disabled' });

  await page.getByRole('button', { name: 'Vorherige Woche' }).click();
  await expect(page.getByRole('heading', { name: 'Letzte Woche' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Windeln' }).getByRole('listitem', { name: 'Mi: 1 Windel' })).toBeVisible();
  await page.getByRole('button', { name: 'Vorherige Woche' }).click();
  await expect(page.getByText('In dieser Woche ist nichts eingetragen.')).toBeVisible();

  // Back to the list.
  await page.getByRole('button', { name: 'Tage' }).click();
  await expect(page.getByRole('heading', { name: 'Heute' })).toBeVisible();
});
