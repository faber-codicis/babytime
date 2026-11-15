import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import pkg from '../../package.json' with { type: 'json' };
import { setKvAndRestart, waitForApp } from './helpers';

// English phone (0.14.0): the app follows the browser language. Only invented data.
test.use({ timezoneId: 'Europe/Vienna', locale: 'en-US' });

async function openAppEnglish(page: Page): Promise<void> {
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole('button', { name: 'Continue without a name' }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
}

const settings = async (page: Page) => {
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  return page.getByRole('main');
};

test('splash and first start are English, <html lang> is en', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('Everything in view, even at 3 a.m.')).toBeAttached();
  await expect(page.getByText('Alles im Blick, auch um 3 Uhr nachts.')).toBeHidden();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible();
  await expect(page.getByText('Your entries stay on this phone.')).toBeVisible();
  await page.screenshot({ path: 'test-results/en-onboarding.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Continue without a name' }).click();
  await expect(page.getByRole('heading', { name: 'Your baby' })).toBeVisible();
  await expect(page.getByText('Nothing logged yet')).toBeVisible();
});

test('Today, History, Settings and backup in English', async ({ page }) => {
  await openAppEnglish(page);

  // Breastfeed with a side switch, diaper, sleep.
  await page.getByRole('button', { name: 'Breastfeed', exact: true }).click();
  await expect(page.getByText('Left side')).toBeVisible();
  await page.getByRole('button', { name: 'Right' }).click();
  await expect(page.getByText('Right side')).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText(/^right · /)).toBeVisible();
  await expect(page.getByText('Next side: left')).toBeAttached();

  await page.getByRole('button', { name: 'Diaper', exact: true }).click();
  await page.getByRole('dialog', { name: 'Diaper' }).getByRole('button', { name: 'Wet' }).click();
  await expect(page.getByText('Diaper saved')).toBeVisible();
  await page.getByRole('button', { name: 'Sleep', exact: true }).click();
  await expect(page.getByText('Sleep started')).toBeVisible();
  await expect(page.getByRole('listitem').nth(1)).toHaveText('1 diaper');
  await page.screenshot({ path: 'test-results/en-today.png', animations: 'disabled' });

  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'History', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /Diaper · wet/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Breastfeed right/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/en-history.png', animations: 'disabled' });

  // Backup: export, delete everything, restore.
  let main = await settings(page);
  await expect(main.getByRole('heading', { level: 2 })).toHaveText(['What do you want to track?', 'Appearance', 'Data', 'About the app']);
  await page.screenshot({ path: 'test-results/en-settings.png', animations: 'disabled', fullPage: true });
  const download = page.waitForEvent('download');
  await main.getByRole('button', { name: /Save backup/ }).click();
  const file = await download;
  const text = readFileSync((await file.path())!, 'utf8');
  await expect(page.getByText('Backup created')).toBeVisible();
  await expect(main.getByRole('button', { name: /Save backup Last backup: today/ })).toBeVisible();

  await main.getByRole('button', { name: /Delete all data/ }).click();
  await page.getByRole('dialog', { name: 'Delete everything?' }).getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue without a name' }).click();

  main = await settings(page);
  const chooser = page.waitForEvent('filechooser');
  await main.getByRole('button', { name: 'Restore backup' }).click();
  await (await chooser).setFiles({ name: file.suggestedFilename(), mimeType: 'application/json', buffer: Buffer.from(text) });
  const restore = page.getByRole('dialog', { name: 'Restore backup' });
  await expect(restore.getByText(/^In the file: \d+\sentries\./)).toBeVisible();
  await restore.getByRole('button', { name: /Replace/ }).click();
  await restore.getByRole('button', { name: 'Yes, replace' }).click();
  await expect(page.getByText(/^Restored: \d+\sentries$/)).toBeVisible();
});

test('the language switch: German sticks after a restart, Automatic follows the phone again', async ({ page }) => {
  await openAppEnglish(page);
  let main = await settings(page);
  const group = main.getByRole('group', { name: 'Language' });
  await expect(group.getByRole('button', { name: 'Automatic' })).toHaveAttribute('aria-pressed', 'true');

  await Promise.all([page.waitForEvent('load'), group.getByRole('button', { name: 'Deutsch' }).click()]);
  await waitForApp(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeVisible();
  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeVisible();

  main = page.getByRole('main');
  await Promise.all([page.waitForEvent('load'), main.getByRole('group', { name: 'Sprache' }).getByRole('button', { name: 'Automatisch' }).click()]);
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
});

test('after the update: English popup with the guide, its button goes straight to the language row', async ({ page }) => {
  await openAppEnglish(page);
  await setKvAndRestart(page, 'lastSeenVersion', '0.13.0');
  const popup = page.getByRole('dialog', { name: `New in version ${pkg.version}` });
  await expect(popup).toBeVisible();
  await expect(popup.getByText(/^Backups have one name everywhere/)).toBeVisible();
  await expect(popup.getByText('How it works')).toBeVisible();
  await expect(popup.getByRole('list', { name: 'Steps' }).getByRole('listitem')).toHaveCount(3);
  // The tall popup starts at its title, although "Got it" further down has the focus.
  await expect(popup.getByRole('button', { name: 'Got it' })).toBeFocused();
  expect(await popup.evaluate((el) => el.scrollTop)).toBe(0);
  await page.screenshot({ path: 'test-results/en-update-popup.png', animations: 'disabled' });

  await popup.getByRole('button', { name: 'Go to language' }).click();
  await expect(popup).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.locator('#settings-language')).toBeFocused();

  // Seen: no popup after a restart; the guides stay in "What's new".
  await page.reload();
  await waitForApp(page);
  await expect(popup).toHaveCount(0);
  await page.getByRole('main').getByRole('link', { name: 'What’s new' }).click();
  await expect(page.getByRole('heading', { name: 'What’s new', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Go to feedback' }).click();
  await expect(page.locator('#settings-feedback')).toBeFocused();
});

test.describe('German phone', () => {
  test.use({ locale: 'de-AT' });

  test('starts German; choosing English switches the whole app', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await page.getByRole('button', { name: 'Ohne Namen fortfahren' }).click();
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    const group = page.getByRole('main').getByRole('group', { name: 'Sprache' });
    await Promise.all([page.waitForEvent('load'), group.getByRole('button', { name: 'English' }).click()]);
    await waitForApp(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
  });
});
