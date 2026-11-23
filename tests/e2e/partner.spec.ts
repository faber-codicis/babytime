import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openApp, openSettings } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

/** "Mit Partner abgleichen" (0.19.0). */

const openPartner = async (page: Page) => {
  await openSettings(page);
  await page.getByRole('main').getByRole('button', { name: /^Mit Partner abgleichen/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Mit Partner abgleichen' });
  await expect(sheet).toBeVisible();
  return sheet;
};

const choosePartnerFile = async (page: Page, sheet: ReturnType<Page['getByRole']>, text: string) => {
  const chooser = page.waitForEvent('filechooser');
  await sheet.getByRole('button', { name: 'Stand übernehmen' }).click();
  await (await chooser).setFiles({ name: 'babytime-abgleich.json', mimeType: 'application/json', buffer: Buffer.from(text) });
};

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('password once, send an encrypted file, take it back in; another password is asked for and saved', async ({ page, browserName }) => {
  // WebKit opens the share sheet instead of a download; Playwright cannot press it.
  test.skip(browserName === 'webkit', 'share sheet in WebKit');
  await page.getByRole('button', { name: 'Windel', exact: true }).click();
  await page.getByRole('dialog', { name: 'Windel' }).getByRole('button', { name: 'Nass' }).click();

  let sheet = await openPartner(page);
  await sheet.getByLabel('Gemeinsames Passwort').fill('kurz');
  await sheet.getByLabel('Passwort wiederholen').fill('kurz');
  await sheet.getByRole('button', { name: 'Passwort speichern' }).click();
  await expect(sheet.getByRole('alert')).toContainText('mindestens 8');
  await sheet.getByLabel('Gemeinsames Passwort').fill('unser-baby-2026');
  await sheet.getByLabel('Passwort wiederholen').fill('unser-baby-2026');
  await sheet.getByRole('button', { name: 'Passwort speichern' }).click();

  const download = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Stand senden' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^babytime-abgleich-\d{4}-\d{2}-\d{2}\.json$/);
  const text = readFileSync((await file.path())!, 'utf8');
  expect(JSON.parse(text)).toMatchObject({ app: 'babytime', encrypted: 1 });
  expect(text).not.toContain('"diaper"'); // quoted: base64 ciphertext never contains quotes
  await expect(page.getByText('Stand gesendet')).toBeVisible();

  // The same state again: nothing to do.
  await choosePartnerFile(page, sheet, text);
  await expect(page.getByText('Schon auf dem gleichen Stand')).toBeVisible();

  // Another password here: the file asks for the one from the other phone and saves it.
  sheet = await openPartner(page);
  await sheet.getByRole('button', { name: 'Passwort ändern' }).click();
  await sheet.getByLabel('Gemeinsames Passwort').fill('ganz-anders-99');
  await sheet.getByLabel('Passwort wiederholen').fill('ganz-anders-99');
  await sheet.getByRole('button', { name: 'Passwort speichern' }).click();
  await choosePartnerFile(page, sheet, text);
  await expect(sheet.getByText('passt nicht zum gespeicherten Passwort')).toBeVisible();
  await sheet.getByLabel('Gemeinsames Passwort').fill('falsch-falsch');
  await sheet.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(sheet.getByRole('alert')).toContainText('Passwort stimmt nicht');
  await sheet.getByLabel('Gemeinsames Passwort').fill('unser-baby-2026');
  await sheet.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(page.getByText('Schon auf dem gleichen Stand')).toBeVisible();

  // Saved now: the next file opens without asking.
  sheet = await openPartner(page);
  await choosePartnerFile(page, sheet, text);
  await expect(page.getByText('Schon auf dem gleichen Stand')).toBeVisible();
});
