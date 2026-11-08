import { expect, test, type Page } from '@playwright/test';
import { openApp, waitForApp } from './helpers';

// The phone is set to dark – the app must still start light (dark is an opt-in switch).
test.use({ colorScheme: 'dark', timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const LIGHT_BG = 'rgb(251, 243, 241)';
const DARK_BG = 'rgb(21, 13, 16)';
const bodyBg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

/** Visible elements whose background or text is pure white (the dark design never uses it). */
async function pureWhite(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const white = 'rgb(255, 255, 255)';
    return [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => el.getClientRects().length > 0 && !el.closest('svg'))
      .filter((el) => {
        const style = getComputedStyle(el);
        return style.backgroundColor === white || (style.color === white && el.innerText.trim() !== '');
      })
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}`);
  });
}

async function darkSwitch(page: Page) {
  await page.getByRole('link', { name: 'Einstellungen' }).click();
  return page.getByRole('switch', { name: /Dunkles Design/ });
}

test('starts light even when the phone is set to dark', async ({ page }) => {
  await openApp(page);
  expect(await bodyBg(page)).toBe(LIGHT_BG);
});

test('the switch turns the dark design on, it survives a restart (splash included) and has no pure white', async ({ page }) => {
  await openApp(page);
  const toggle = await darkSwitch(page);
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await page.screenshot({ path: 'test-results/dark-switch-off.png', animations: 'disabled' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(await bodyBg(page)).toBe(DARK_BG);
  expect(await pureWhite(page)).toEqual([]);
  await page.screenshot({ path: 'test-results/dark-settings.png', animations: 'disabled' });

  // Restart: dark from the first paint, before the app script runs.
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  expect(await page.locator('#splash').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(DARK_BG);
  await page.unroute('**/assets/*.js');
  await page.reload();
  await waitForApp(page);

  await page.getByRole('link', { name: 'Heute' }).click();
  await page.getByRole('button', { name: 'Schlaf', exact: true }).click();
  await expect(page.getByText('schläft gerade')).toBeVisible();
  expect(await pureWhite(page)).toEqual([]);
  await page.screenshot({ path: 'test-results/dark-today.png', animations: 'disabled' });

  await page.getByRole('button', { name: 'Windel', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Windel' })).toBeVisible();
  expect(await pureWhite(page)).toEqual([]);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Stillen', exact: true }).click();
  await expect(page.getByText('Linke Seite')).toBeVisible();
  expect(await pureWhite(page)).toEqual([]);
  await page.screenshot({ path: 'test-results/dark-feeding.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Fertig' }).click();

  await page.getByRole('link', { name: 'Verlauf' }).click();
  await expect(page.getByRole('heading', { name: 'Verlauf', level: 1 })).toBeVisible();
  expect(await pureWhite(page)).toEqual([]);
  await page.screenshot({ path: 'test-results/dark-history.png', animations: 'disabled' });
});

test('switching off returns to light; "Alle Daten löschen" also resets to light', async ({ page }) => {
  await openApp(page);
  const toggle = await darkSwitch(page);
  await toggle.click();
  expect(await bodyBg(page)).toBe(DARK_BG);
  await toggle.click();
  expect(await bodyBg(page)).toBe(LIGHT_BG);

  await toggle.click();
  await page.getByRole('button', { name: /Alle Daten löschen/ }).click();
  await page.getByRole('dialog', { name: 'Alles löschen?' }).getByRole('button', { name: 'Alles löschen' }).click();
  await expect(page.getByRole('heading', { name: 'Herzlichen Glückwunsch!' })).toBeVisible();
  expect(await bodyBg(page)).toBe(LIGHT_BG);
});
