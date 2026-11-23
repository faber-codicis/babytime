import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import pkg from '../../package.json' with { type: 'json' };
import { setKvAndRestart, skipTutorial, waitForApp } from './helpers';

// English phone (0.14.0): the app follows the browser language. Only invented data.
test.use({ timezoneId: 'Europe/Vienna', locale: 'en-US' });

async function openAppEnglish(page: Page): Promise<void> {
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole('button', { name: 'Continue without a name' }).click();
  await skipTutorial(page, 'Skip');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
}

const settings = async (page: Page, sub?: string) => {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  if (sub) {
    await page.getByRole('main').getByRole('link', { name: new RegExp(`^${sub}`) }).click();
    await expect(page.getByRole('heading', { name: sub, level: 1 })).toBeVisible();
  }
  return page.getByRole('main');
};

/** The language picker on the settings overview (a native select since 0.17.0). */
const languagePicker = (page: Page, name: string) => page.getByRole('main').getByRole('combobox', { name });

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
  await skipTutorial(page, 'Skip');
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
  await expect(main.getByRole('heading', { level: 2 })).toHaveText(['Everyday', 'Personalise', 'Help and info']);
  await page.screenshot({ path: 'test-results/en-settings.png', animations: 'disabled', fullPage: true });
  main = await settings(page, 'Data & backup');
  const download = page.waitForEvent('download');
  await main.getByRole('button', { name: 'Save backup' }).click();
  const file = await download;
  const text = readFileSync((await file.path())!, 'utf8');
  await expect(page.getByText('Backup created')).toBeVisible();
  await expect(main.getByRole('region', { name: 'Last backup: today' })).toBeVisible();

  await main.getByRole('button', { name: /Delete all data/ }).click();
  await page.getByRole('dialog', { name: 'Delete everything?' }).getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue without a name' }).click();
  await skipTutorial(page, 'Skip');

  main = await settings(page, 'Data & backup');
  const chooser = page.waitForEvent('filechooser');
  await main.getByRole('button', { name: 'Restore backup' }).click();
  await (await chooser).setFiles({ name: file.suggestedFilename(), mimeType: 'application/json', buffer: Buffer.from(text) });
  const restore = page.getByRole('dialog', { name: 'Restore backup' });
  await expect(restore.getByText(/^In the file: \d+\sentries\./)).toBeVisible();
  await restore.getByRole('button', { name: /Replace/ }).click();
  await restore.getByRole('button', { name: 'Yes, replace' }).click();
  await expect(page.getByText(/^Restored: \d+\sentries$/)).toBeVisible();
});

test('the language switch: German sticks after a restart, System follows the phone again', async ({ page }) => {
  await openAppEnglish(page);
  await settings(page);
  const picker = languagePicker(page, 'Sprache · Language');
  await expect(picker).toHaveValue('auto');
  await expect(picker.locator('option:checked')).toHaveText('System (English)');

  await Promise.all([page.waitForEvent('load'), picker.selectOption('de')]);
  await waitForApp(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeVisible();
  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Einstellungen', level: 1 })).toBeVisible();

  await expect(picker).toHaveValue('de');
  await Promise.all([page.waitForEvent('load'), picker.selectOption('auto')]);
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
});

test('System follows the phone even when the browser still lists German first for websites (0.15.2)', async ({ page }) => {
  // Android Chrome after switching the phone to English: the system locale is English, the website list is still German.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', { get: () => ['de-DE', 'de'] });
    Object.defineProperty(navigator, 'language', { get: () => 'de-DE' });
  });
  await openAppEnglish(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await settings(page);
  const picker = languagePicker(page, 'Sprache · Language');
  await expect(picker).toHaveValue('auto');
  await expect(picker.locator('option:checked')).toHaveText('System (English)');
});

test('after the update: English popup with the newest guide, its button goes straight to the settings row', async ({ page }) => {
  await openAppEnglish(page);
  await setKvAndRestart(page, 'lastSeenVersion', '0.13.0');
  const popup = page.getByRole('dialog', { name: `New in version ${pkg.version}` });
  await expect(popup).toBeVisible();
  await expect(popup.getByText(/^Settings are now a short overview with sub pages/)).toBeVisible();
  await expect(popup.getByText('How it works')).toBeVisible();
  await expect(popup.getByRole('list', { name: 'Steps' }).getByRole('listitem')).toHaveCount(3);
  // The tall popup starts at its title, although "Got it" further down has the focus.
  await expect(popup.getByRole('button', { name: 'Got it' })).toBeFocused();
  expect(await popup.evaluate((el) => el.scrollTop)).toBe(0);
  await page.screenshot({ path: 'test-results/en-update-popup.png', animations: 'disabled' });

  // Only the newest guide (0.18.0: the baby photo) sits in the popup; older ones stay in "What's new".
  await expect(popup.getByRole('button', { name: 'Go to introduction' })).toHaveCount(0);
  await popup.getByRole('button', { name: 'Go to profile' }).click();
  await expect(popup).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.locator('#settings-profile')).toBeFocused();

  // Seen: no popup after a restart; the guides stay in "What's new".
  await page.reload();
  await waitForApp(page);
  await expect(popup).toHaveCount(0);
  await settings(page, 'About the app');
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
    await skipTutorial(page);
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    const picker = languagePicker(page, 'Sprache · Language');
    await expect(picker.locator('option:checked')).toHaveText('System (Deutsch)');
    await Promise.all([page.waitForEvent('load'), picker.selectOption('en')]);
    await waitForApp(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
  });
});
