import { expect, test } from '@playwright/test';
import { waitForApp } from './helpers';

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
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
});

test('name and birth date show on Today, and the first start does not come back', async ({ page }) => {
  await page.getByLabel('Wie heißt dein Baby?').fill('Lena');
  await page.getByLabel('Geburtsdatum').fill('2026-10-09');
  await page.getByRole('button', { name: 'Los geht’s' }).click();

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
  await expect(page.getByRole('heading', { name: 'Dein Baby' })).toBeVisible();
});
