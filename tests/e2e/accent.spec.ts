import { expect, test, type Page } from '@playwright/test';
import { openApp, openSettings, waitForApp } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const accentOf = (page: Page) => page.evaluate(() => document.documentElement.dataset.accent ?? 'rose');
const roseToken = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--rose').trim());
const barColour = (page: Page) => page.locator('meta[name="theme-color"]').getAttribute('content');

async function openLook(page: Page) {
  await openSettings(page, 'Darstellung');
  return page.getByRole('radiogroup', { name: 'Akzentfarbe' });
}

test('five accent colours; the choice applies at once, survives a restart and follows the dark design', async ({ page }) => {
  await openApp(page);
  const group = await openLook(page);
  const radios = group.getByRole('radio');
  await expect(radios).toHaveCount(5);
  await expect(group.getByRole('radio', { name: 'Rosé' })).toHaveAttribute('aria-checked', 'true');
  expect(await roseToken(page)).toBe('#b04a63');

  await group.getByRole('radio', { name: 'Grün' }).click();
  await expect(group.getByRole('radio', { name: 'Grün' })).toHaveAttribute('aria-checked', 'true');
  await expect(group.getByRole('radio', { name: 'Rosé' })).toHaveAttribute('aria-checked', 'false');
  expect(await accentOf(page)).toBe('green');
  expect(await roseToken(page)).toBe('#2f7a55');
  expect(await barColour(page)).toBe('#2F7A55');
  await page.screenshot({ path: 'test-results/accent-green.png', animations: 'disabled' });

  // Arrow keys move the choice (radio group).
  await group.getByRole('radio', { name: 'Grün' }).press('ArrowRight');
  await expect(group.getByRole('radio', { name: 'Lila' })).toBeFocused();
  expect(await accentOf(page)).toBe('purple');

  // Restart: the accent is there from the first paint, before the app script runs.
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.reload();
  expect(await accentOf(page)).toBe('purple');
  expect(await barColour(page)).toBe('#7353B8');
  await page.unroute('**/assets/*.js');
  await page.reload();
  await waitForApp(page);

  // Dark design: the dark variant of the accent; the bar stays dark.
  await openSettings(page, 'Darstellung');
  await page.getByRole('group', { name: 'Design' }).getByRole('button', { name: 'Dunkel' }).click();
  expect(await roseToken(page)).toBe('#a48ad8');
  expect(await barColour(page)).toBe('#150D10');
  await page.screenshot({ path: 'test-results/accent-purple-dark.png', animations: 'disabled' });
});

test('"Alle Daten löschen" goes back to rosé', async ({ page }) => {
  await openApp(page);
  const group = await openLook(page);
  await group.getByRole('radio', { name: 'Orange' }).click();
  expect(await accentOf(page)).toBe('orange');
  await openSettings(page, 'Daten & Backup');
  await page.getByRole('button', { name: /Alle Daten löschen/ }).click();
  await page.getByRole('dialog', { name: 'Alles löschen?' }).getByRole('button', { name: 'Alles löschen' }).click();
  await expect(page.getByRole('heading', { name: 'Herzlichen Glückwunsch!' })).toBeVisible();
  expect(await accentOf(page)).toBe('rose');
  expect(await page.evaluate(() => localStorage.getItem('babytime-accent'))).toBeNull();
  expect(await barColour(page)).toBe('#B04A63');
});
