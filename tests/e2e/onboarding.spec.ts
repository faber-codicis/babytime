import { expect, test } from '@playwright/test';
import { skipTutorial, waitForApp } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 21, 14, 20).getTime() });
  await page.goto('/');
  await waitForApp(page);
});

test('first start: welcome screen without tab bar, everything optional', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Herzlichen Glückwunsch!' })).toBeVisible();
  await expect(page.getByText('Deine Einträge bleiben auf diesem Handy.')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/onboarding.png', animations: 'disabled' });

  // "Los geht's" without any input also works.
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  await skipTutorial(page);
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
});

test('name and birth date show on Today, and the first start does not come back', async ({ page }) => {
  await page.getByLabel('Wie heißt dein Baby?').fill('Lena');
  await page.getByLabel('Geburtsdatum').fill('2026-10-09');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  await skipTutorial(page);

  await expect(page.getByRole('heading', { name: 'Lena' })).toBeVisible();
  await expect(page.getByText('12 Tage alt · Mittwoch, 14:20')).toBeVisible();

  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Lena' })).toBeVisible();
});

test('a birth date in the future is rejected at the field', async ({ page }) => {
  await page.getByLabel('Geburtsdatum').fill('2026-12-24');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  await expect(page.getByText('Das Geburtsdatum liegt in der Zukunft.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Herzlichen Glückwunsch!' })).toBeVisible();
});

test('a birth date more than 24 months back is rejected, 24 months is fine', async ({ page }) => {
  await page.getByLabel('Geburtsdatum').fill('1990-05-05');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  await expect(page.getByText(/bis 24 Monate\. Bitte ein jüngeres Datum wählen\./)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Herzlichen Glückwunsch!' })).toBeVisible();

  await page.getByLabel('Geburtsdatum').fill('2024-10-21');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  await expect(page.getByText('2 Jahre alt · Mittwoch, 14:20')).toBeVisible();
});

test('age shows weeks and months as the baby grows', async ({ page }) => {
  await page.getByLabel('Geburtsdatum').fill('2026-09-02');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  await expect(page.getByText('7 Wochen alt · Mittwoch, 14:20')).toBeVisible();
});

test('"Ohne Namen fortfahren" skips the fields', async ({ page }) => {
  await page.getByLabel('Wie heißt dein Baby?').fill('Wird nicht gespeichert');
  await page.getByRole('button', { name: 'Ohne Namen fortfahren' }).click();
  await skipTutorial(page);
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
});

test('the short introduction follows the first start once, and opens again from Einstellungen', async ({ page }) => {
  await page.getByRole('button', { name: 'Ohne Namen fortfahren' }).click();
  const intro = page.getByRole('dialog', { name: 'So funktioniert Baby Time' });
  await expect(intro).toBeVisible();
  await expect(intro.getByText('1 von 5')).toBeVisible();
  await expect(intro.getByRole('heading', { name: 'Stillen mit einem Tipp' })).toBeVisible();
  await expect(intro.getByRole('button', { name: 'Weiter' })).toBeFocused();

  await intro.getByRole('button', { name: 'Weiter' }).click();
  await expect(intro.getByRole('heading', { name: 'Windel, Flasche, Schlaf' })).toBeVisible();
  await intro.getByRole('button', { name: 'Zurück' }).click();
  await expect(intro.getByRole('heading', { name: 'Stillen mit einem Tipp' })).toBeVisible();
  for (let i = 0; i < 4; i++) await intro.getByRole('button', { name: 'Weiter' }).click();
  await expect(intro.getByText('5 von 5')).toBeVisible();
  await expect(intro.getByRole('button', { name: 'Überspringen' })).toHaveCount(0);
  await intro.getByRole('button', { name: 'Los geht’s' }).click();
  await expect(intro).toBeHidden();

  // Closed for good: not again after a restart.
  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Again from Einstellungen, starting at the first card.
  await page.getByRole('link', { name: 'Einstellungen' }).click();
  await page.getByRole('button', { name: /So funktioniert Baby Time/ }).click();
  await expect(intro.getByText('1 von 5')).toBeVisible();
  await page.screenshot({ path: 'test-results/tutorial.png', animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(intro).toBeHidden();
});
