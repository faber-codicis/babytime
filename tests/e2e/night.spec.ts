import { expect, test, type Page } from '@playwright/test';
import { openApp, seed, waitForApp } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const at = (h: number, m = 0) => new Date(2026, 9, 21, h, m).getTime();
const DARK_BG = 'rgb(21, 13, 16)';
const LIGHT_BG = 'rgb(251, 243, 241)';
const bodyBg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

async function nightSwitch(page: Page) {
  await page.getByRole('link', { name: 'Einstellungen' }).click();
  return page.getByRole('switch', { name: /Nachts automatisch/ });
}

test('at night: "Nachts automatisch" turns dark at once, Today shows the night view; sun and moon switch views', async ({ page }) => {
  await page.clock.install({ time: at(3, 12) });
  await openApp(page);
  await seed(page, [{ type: 'feed', side: 'right', start: at(0, 50), end: at(1, 7) }]);
  const toggle = await nightSwitch(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('switch', { name: /Dunkles Design/ })).toHaveAttribute('aria-checked', 'false');
  expect(await bodyBg(page)).toBe(DARK_BG);

  await page.getByRole('link', { name: 'Heute' }).click();
  await expect(page.getByText('Nachtansicht')).toBeVisible();
  await expect(page.getByText('2:05', { exact: true })).toBeVisible();
  await expect(page.getByText('Std · rechts')).toBeVisible();
  await page.screenshot({ path: 'test-results/night-view.png', animations: 'disabled' });
  // 0.15.0: no countdown at rest – the ring stays empty however long ago the feed was.
  const ring = page.locator('.night-ring-progress');
  expect(Number(await ring.getAttribute('stroke-dashoffset'))).toBeCloseTo(Number(await ring.getAttribute('stroke-dasharray')), 3);

  await page.getByRole('button', { name: 'Tagesansicht zeigen' }).click();
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  // Still the day view after a tab switch.
  await page.getByRole('link', { name: 'Verlauf' }).click();
  await page.getByRole('link', { name: 'Heute' }).click();
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await page.getByRole('button', { name: 'Nachtansicht zeigen' }).click();
  await expect(page.getByText('Nachtansicht')).toBeVisible();

  await page.getByRole('button', { name: 'Stillen links starten' }).click();
  await expect(page).toHaveURL(/#\/stillen$/);
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByText('Nachtansicht')).toBeVisible();
});

test('night mode at daytime: light and the normal Today; dark from the first paint after a restart at night', async ({ page }) => {
  await page.clock.install({ time: at(10) });
  await openApp(page);
  await (await nightSwitch(page)).click();
  expect(await bodyBg(page)).toBe(LIGHT_BG);
  await page.getByRole('link', { name: 'Heute' }).click();
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(page.getByRole('figure', { name: 'Der heutige Tag von 0 bis 24 Uhr' })).toBeVisible();

  // The clock runs into the evening while the app is open: the design follows within a minute.
  await page.clock.fastForward('10:00:00');
  await page.clock.runFor(61_000);
  expect(await bodyBg(page)).toBe(DARK_BG);

  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  await waitForApp(page);
});
