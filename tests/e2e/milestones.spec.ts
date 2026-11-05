import { expect, test } from '@playwright/test';
import { waitForApp } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 5, 14, 20).getTime() });
  await page.goto('/');
  await waitForApp(page);
  await page.getByLabel('Wie heißt dein Baby?').fill('Lena');
  await page.getByLabel('Geburtsdatum').fill('2026-09-01');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
});

const nav = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Hauptnavigation' });

test('four tabs; mark a suggestion with date and note, add an own milestone, edit and delete', async ({ page }) => {
  await expect(nav(page).getByRole('link')).toHaveText(['Heute', 'Verlauf', 'Meilensteine', 'Einstellungen']);
  await nav(page).getByRole('link', { name: 'Meilensteine' }).click();
  await expect(page).toHaveURL(/#\/meilensteine$/);
  await expect(page.getByRole('heading', { name: 'Meilensteine', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Erstes Lächeln' }).click();
  const sheet = page.getByRole('dialog', { name: 'Erstes Lächeln' });
  await expect(sheet.getByLabel('Wann?')).toHaveValue('2026-11-05');
  await sheet.getByLabel('Wann?').fill('2026-10-20');
  await sheet.getByLabel('Notiz (freiwillig)').fill('beim Wickeln');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Meilenstein gespeichert')).toBeVisible();

  const reached = page.getByRole('region', { name: 'Erreicht' });
  await expect(reached.getByRole('button', { name: /Erstes Lächeln/ })).toContainText('20. Oktober 2026 · mit 7 Wochen');
  await expect(reached).toContainText('beim Wickeln');
  // A reached suggestion leaves the list of suggestions.
  await expect(page.getByRole('region', { name: 'Vorschläge' }).getByRole('button', { name: 'Erstes Lächeln' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Eigenen Meilenstein eintragen' }).click();
  const own = page.getByRole('dialog', { name: 'Meilenstein eintragen' });
  await own.getByRole('button', { name: 'Speichern' }).click();
  await expect(own.getByText('Bitte einen Namen eingeben.')).toBeVisible();
  await own.getByLabel('Was ist passiert?').fill('Erstes Bad im Meer');
  await own.getByRole('button', { name: 'Speichern' }).click();
  await expect(reached.getByRole('button').first()).toContainText('Erstes Bad im Meer');
  await page.screenshot({ path: 'test-results/milestones.png', fullPage: true, animations: 'disabled' });

  await reached.getByRole('button', { name: /Erstes Lächeln/ }).click();
  const edit = page.getByRole('dialog', { name: 'Erstes Lächeln' });
  await edit.getByRole('button', { name: 'Löschen' }).click();
  await expect(edit.getByRole('button', { name: 'Behalten' })).toBeFocused();
  await edit.getByRole('button', { name: 'Ja, löschen' }).click();
  await expect(page.getByText('Meilenstein gelöscht')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Vorschläge' }).getByRole('button', { name: 'Erstes Lächeln' })).toBeVisible();
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(reached.getByRole('button', { name: /Erstes Lächeln/ })).toBeVisible();
});

test('switching Meilensteine off in the settings leaves three tabs; the address then shows Today', async ({ page }) => {
  await nav(page).getByRole('link', { name: 'Einstellungen' }).click();
  const toggle = page.getByRole('switch', { name: /Meilensteine/ });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(nav(page).getByRole('link')).toHaveText(['Heute', 'Verlauf', 'Einstellungen']);

  await page.goto('/#/meilensteine');
  await expect(page.getByRole('heading', { name: 'Lena' })).toBeVisible();

  await nav(page).getByRole('link', { name: 'Einstellungen' }).click();
  await page.getByRole('switch', { name: /Meilensteine/ }).click();
  await expect(nav(page).getByRole('link')).toHaveCount(4);
});

test('four tab labels fit on a 360 px phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  for (const label of await page.locator('.tab-label').all()) {
    expect(await label.evaluate((el) => el.scrollWidth <= el.clientWidth), await label.innerText()).toBe(true);
  }
});
