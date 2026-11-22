import { expect, test } from '@playwright/test';
import { openApp, openSettings } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const at = (h: number, m = 0) => new Date(2026, 9, 21, h, m).getTime();

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: at(14, 20) });
  await openApp(page);
});

test('switched-off trackers disappear from Today; at least one stays on', async ({ page }) => {
  await openSettings(page, 'Erfassen');
  const section = page.getByRole('region', { name: 'Was möchtest du festhalten?' });
  for (const name of ['Stillen', 'Flasche', 'Abpumpen', 'Windel', 'Schlaf']) {
    await expect(section.getByRole('switch', { name: new RegExp(`^${name}`) })).toHaveAttribute('aria-checked', 'true');
  }
  await section.getByRole('switch', { name: /^Flasche/ }).click();
  await section.getByRole('switch', { name: /^Windel/ }).click();
  await expect(section.getByRole('switch', { name: /^Windel/ })).toHaveAttribute('aria-checked', 'false');

  await page.getByRole('link', { name: 'Heute' }).click();
  const dock = page.getByRole('navigation', { name: 'Eintragen' });
  await expect(dock.getByRole('button', { name: 'Windel', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Windel' })).toHaveCount(0);
  // Only pumping left of the two: the button says so, the sheet has no Flasche/Abpumpen switch.
  await dock.getByRole('button', { name: 'Abpumpen' }).click();
  const sheet = page.getByRole('dialog', { name: 'Abpumpen' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('group', { name: /Flasche oder Abpumpen/ })).toHaveCount(0);
  await page.keyboard.press('Escape');

  // Switch off everything else: the last one stays on, with a message.
  await openSettings(page, 'Erfassen');
  for (const name of ['Stillen', 'Abpumpen']) await section.getByRole('switch', { name: new RegExp(`^${name}`) }).click();
  await section.getByRole('switch', { name: /^Schlaf/ }).click();
  await expect(page.getByText('Mindestens eins bleibt eingeschaltet')).toBeVisible();
  await expect(section.getByRole('switch', { name: /^Schlaf/ })).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('link', { name: 'Heute' }).click();
  await expect(page.getByText('Zuletzt gestillt')).toHaveCount(0);
  await expect(dock.getByRole('button')).toHaveText(['Schlaf']);
});

test('the timeline can be hidden', async ({ page }) => {
  const figure = page.getByRole('figure', { name: 'Der heutige Tag von 0 bis 24 Uhr' });
  await expect(figure).toBeVisible();
  await openSettings(page, 'Darstellung');
  await page.getByRole('switch', { name: /^Zeitleiste auf Heute/ }).click();
  await page.getByRole('link', { name: 'Heute' }).click();
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(figure).toHaveCount(0);
});
