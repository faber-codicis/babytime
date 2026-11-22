import { expect, test, type Page } from '@playwright/test';
import { openApp, openSettings, waitForApp } from './helpers';

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

/** Since 0.17.0 one choice of three (Hell, Dunkel, Nachts) instead of two switches. */
async function designChoice(page: Page) {
  await openSettings(page, 'Darstellung');
  const group = page.getByRole('group', { name: 'Design' });
  return { light: group.getByRole('button', { name: 'Hell' }), dark: group.getByRole('button', { name: 'Dunkel' }) };
}

test('starts light even when the phone is set to dark', async ({ page }) => {
  await openApp(page);
  expect(await bodyBg(page)).toBe(LIGHT_BG);
});

test('"Dunkel" turns the dark design on, it survives a restart (splash included) and has no pure white', async ({ page }) => {
  await openApp(page);
  const choice = await designChoice(page);
  await expect(choice.light).toHaveAttribute('aria-pressed', 'true');
  await expect(choice.dark).toHaveAttribute('aria-pressed', 'false');
  await page.screenshot({ path: 'test-results/dark-switch-off.png', animations: 'disabled' });
  await choice.dark.click();
  await expect(choice.dark).toHaveAttribute('aria-pressed', 'true');
  await expect(choice.light).toHaveAttribute('aria-pressed', 'false');
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

test('"Hell" returns to light; "Alle Daten löschen" also resets to light', async ({ page }) => {
  await openApp(page);
  const choice = await designChoice(page);
  await choice.dark.click();
  expect(await bodyBg(page)).toBe(DARK_BG);
  await choice.light.click();
  expect(await bodyBg(page)).toBe(LIGHT_BG);

  await choice.dark.click();
  await openSettings(page, 'Daten & Backup');
  await page.getByRole('button', { name: /Alle Daten löschen/ }).click();
  await page.getByRole('dialog', { name: 'Alles löschen?' }).getByRole('button', { name: 'Alles löschen' }).click();
  await expect(page.getByRole('heading', { name: 'Herzlichen Glückwunsch!' })).toBeVisible();
  expect(await bodyBg(page)).toBe(LIGHT_BG);
});
