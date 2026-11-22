import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { openApp, openSettings, skipTutorial, waitForApp } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

/** Opens Einstellungen → Daten & Backup (0.4.0: settings tab; 0.17.0: own sub page). */
const openData = async (page: Page) => {
  await openSettings(page, 'Daten & Backup');
  return page.getByRole('main');
};

/** Clicks "Sicherung speichern" and returns the downloaded file's text. */
async function exportBackup(page: Page): Promise<{ name: string; text: string }> {
  const sheet = await openData(page);
  const download = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Sicherung speichern' }).click();
  const file = await download;
  return { name: file.suggestedFilename(), text: readFileSync((await file.path())!, 'utf8') };
}

async function chooseRestoreFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  const sheet = await openData(page);
  const chooser = page.waitForEvent('filechooser');
  await sheet.getByRole('button', { name: 'Sicherung wiederherstellen' }).click();
  await (await chooser).setFiles(file);
  const restore = page.getByRole('dialog', { name: 'Sicherung wiederherstellen' });
  await expect(restore).toBeVisible();
  return restore;
}

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('export, delete everything, restore in the fresh app: all entries are back', async ({ page }) => {
  await page.getByRole('button', { name: 'Schlaf', exact: true }).click();
  await page.getByRole('button', { name: 'Wach', exact: true }).click();
  await page.getByRole('button', { name: 'Windel', exact: true }).click();
  await page.getByRole('dialog', { name: 'Windel' }).getByRole('button', { name: 'Voll' }).click();

  const backup = await exportBackup(page);
  expect(backup.name).toMatch(/^babytime-\d{4}-\d{2}-\d{2}\.json$/);
  expect(JSON.parse(backup.text)).toMatchObject({ app: 'babytime', schemaVersion: 3 });
  await expect(page.getByText('Sicherung erstellt')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Letzte Sicherung: heute' })).toBeVisible();

  // Delete all: asks first, Abbrechen is the default.
  const sheet = await openData(page);
  await sheet.getByRole('button', { name: /Alle Daten löschen/ }).click();
  const confirm = page.getByRole('dialog', { name: 'Alles löschen?' });
  await expect(confirm.getByText('Das lässt sich nicht rückgängig machen.')).toBeVisible();
  await expect(confirm.getByRole('button', { name: 'Abbrechen' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Alles löschen' }).click();

  // Like a fresh install: first start again, name still optional.
  await expect(page.getByRole('heading', { name: 'Herzlichen Glückwunsch!' })).toBeVisible();
  await page.getByRole('button', { name: 'Ohne Namen fortfahren' }).click();
  await skipTutorial(page);
  await expect(page.getByText('Noch nichts eingetragen')).toBeVisible();

  const restore = await chooseRestoreFile(page, { name: backup.name, mimeType: 'application/json', buffer: Buffer.from(backup.text) });
  await expect(restore.getByText(/In der Datei: 2\sEinträge\./)).toBeVisible();
  await expect(restore.getByRole('button', { name: 'Ja, ersetzen' })).toBeDisabled();
  await restore.getByRole('button', { name: /Ersetzen/ }).click();
  await restore.getByRole('button', { name: 'Ja, ersetzen' }).click();

  await expect(page.getByText('Wiederhergestellt: 2 Einträge')).toBeVisible();
  await page.getByRole('link', { name: 'Verlauf' }).click();
  await expect(page.getByRole('button', { name: /Windel voll/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Schlaf · / })).toBeVisible();
});

test('a manipulated file is refused with a clear message and changes nothing', async ({ page }) => {
  await page.getByRole('button', { name: 'Windel', exact: true }).click();
  await page.getByRole('dialog', { name: 'Windel' }).getByRole('button', { name: 'Nass' }).click();

  const evil = JSON.stringify({
    app: 'babytime',
    schemaVersion: 1,
    events: [{ id: '00000000-0000-4000-8000-000000000001', type: 'feed', start: 'gestern', side: 'left', __proto__: { admin: true } }],
  });
  const restore = await chooseRestoreFile(page, { name: 'evil.json', mimeType: 'application/json', buffer: Buffer.from(evil) });
  await expect(restore.getByRole('alert')).toHaveText('Eintrag 1 in der Datei ist fehlerhaft. Es wurde nichts geändert.');
  await restore.getByRole('button', { name: 'Abbrechen' }).click();
  await page.getByRole('link', { name: 'Verlauf' }).click();
  await expect(page.getByRole('button', { name: /Windel nass/ })).toBeVisible();

  const notBackup = await chooseRestoreFile(page, { name: 'foto.json', mimeType: 'application/json', buffer: Buffer.from('<html>') });
  await expect(notBackup.getByRole('alert')).toHaveText('Die Datei lässt sich nicht lesen. Es wurde nichts geändert.');
});

test('a huge file is refused before reading it', async ({ page }) => {
  const big = Buffer.alloc(10 * 1024 * 1024 + 1, 32);
  const restore = await chooseRestoreFile(page, { name: 'gross.json', mimeType: 'application/json', buffer: big });
  await expect(restore.getByRole('alert')).toHaveText('Die Datei ist zu groß (höchstens 10 MB). Es wurde nichts geändert.');
});

test('edit the profile from the settings', async ({ page }) => {
  await openSettings(page);
  const settings = page.getByRole('main');
  await expect(settings.getByText('Name eintragen')).toBeVisible();
  await settings.getByRole('button', { name: 'Profil bearbeiten' }).click();
  const profile = page.getByRole('dialog', { name: 'Profil bearbeiten' });
  await profile.getByLabel('Wie heißt dein Baby?').fill('Lena');
  await profile.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Profil gespeichert')).toBeVisible();
  await expect(settings.getByText('Lena', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Heute' }).click();
  await expect(page.getByRole('heading', { name: 'Lena' })).toBeVisible();
  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Lena' })).toBeVisible();
});

test('export with password: file is encrypted, restore needs the right password', async ({ page }) => {
  await page.getByRole('button', { name: 'Windel', exact: true }).click();
  await page.getByRole('dialog', { name: 'Windel' }).getByRole('button', { name: 'Nass' }).click();

  const main = await openData(page);
  await main.getByRole('button', { name: /Sicherung mit Passwort/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Sicherung mit Passwort' });
  await sheet.getByLabel('Passwort', { exact: true }).fill('kurz');
  await sheet.getByLabel('Passwort wiederholen').fill('kurz');
  await sheet.getByRole('button', { name: 'Datei erstellen' }).click();
  await expect(sheet.getByText('Bitte mindestens 8 Zeichen.')).toBeVisible();
  await sheet.getByLabel('Passwort', { exact: true }).fill('geheim123');
  await sheet.getByLabel('Passwort wiederholen').fill('geheim123');
  await sheet.getByRole('button', { name: 'Datei erstellen' }).click();
  const download = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Datei speichern' }).click();
  const file = await download;
  const name = file.suggestedFilename();
  const text = readFileSync((await file.path())!, 'utf8');
  expect(name).toMatch(/^babytime-\d{4}-\d{2}-\d{2}-verschluesselt\.json$/);
  expect(JSON.parse(text)).toMatchObject({ app: 'babytime', encrypted: 1 });
  expect(text).not.toContain('wet');
  await expect(page.getByText('Sicherung erstellt')).toBeVisible();

  const restore = await chooseRestoreFile(page, { name, mimeType: 'application/json', buffer: Buffer.from(text) });
  await restore.getByLabel('Passwort').fill('falsch123');
  await restore.getByRole('button', { name: 'Entschlüsseln' }).click();
  await expect(restore.getByText('Das Passwort stimmt nicht, oder die Datei ist beschädigt.')).toBeVisible();
  await restore.getByLabel('Passwort').fill('geheim123');
  await restore.getByRole('button', { name: 'Entschlüsseln' }).click();
  await expect(restore.getByText(/In der Datei: 1\sEintrag\./)).toBeVisible();
  await restore.getByRole('button', { name: /Ersetzen/ }).click();
  await restore.getByRole('button', { name: 'Ja, ersetzen' }).click();
  await expect(page.getByText('Wiederhergestellt: 1 Eintrag')).toBeVisible();
});
