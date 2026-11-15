import { expect, test, type Page } from '@playwright/test';
import { openApp } from './helpers';

test.use({ timezoneId: 'Europe/Vienna', locale: 'de-AT' });

const at = (h: number, m = 0) => new Date(2026, 9, 21, h, m).getTime();
const NOW = at(14, 20);

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW });
  await openApp(page);
});

const bottleButton = (page: Page) => page.getByRole('button', { name: 'Flasche oder Abpumpen' });

test('bottle in 2 taps with the default amount, undo removes it', async ({ page }) => {
  // Without bottles, Today keeps its three counters.
  await expect(page.getByRole('listitem')).toHaveText(['0× gestillt', '0 Windeln', '0 Min Schlaf']);

  await bottleButton(page).click(); // 1
  const sheet = page.getByRole('dialog', { name: 'Flasche' });
  await expect(sheet.getByText('60 ml')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Muttermilch' })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: 'test-results/bottle-sheet.png', animations: 'disabled' });
  await sheet.getByRole('button', { name: 'Speichern' }).click(); // 2

  await expect(sheet).toBeHidden();
  await expect(page.getByText('Flasche gespeichert · 60 ml')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveText(['0× gestillt', '0 Windeln', '0 Min Schlaf', '60 ml Flasche']);
  await page.screenshot({ path: 'test-results/bottle-today.png', animations: 'disabled' });

  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(3);
});

test('plus and minus change the amount; the next opening starts with the last bottle', async ({ page }) => {
  await bottleButton(page).click();
  const sheet = page.getByRole('dialog', { name: 'Flasche' });
  await sheet.getByRole('button', { name: '10 ml mehr' }).click();
  await sheet.getByRole('button', { name: '10 ml mehr' }).click();
  await sheet.getByRole('button', { name: '10 ml mehr' }).click();
  await sheet.getByRole('button', { name: '10 ml weniger' }).click();
  await expect(sheet.getByText('80 ml')).toBeVisible();
  await sheet.getByRole('button', { name: 'Pulvermilch' }).click();
  await sheet.getByRole('button', { name: 'vor 15 Minuten' }).click();
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Flasche gespeichert · 80 ml')).toBeVisible();

  await bottleButton(page).click();
  await expect(sheet.getByText('80 ml')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Pulvermilch' })).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet.getByRole('button', { name: 'jetzt' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: 'Verlauf' }).click();
  const row = page.getByRole('button', { name: /Flasche · 80 ml Pulvermilch/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText('14:05');
  await expect(page.getByText('0× gestillt · 0 Windeln · 0 Min Schlaf · 80 ml Flasche')).toBeVisible();
});

test('pumping: switch the mode, pick a side; history shows it and it can be edited', async ({ page }) => {
  await bottleButton(page).click();
  await page.getByRole('dialog', { name: 'Flasche' }).getByRole('button', { name: 'Abpumpen', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Abpumpen' });
  await expect(sheet.getByRole('button', { name: 'Beide' })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('button', { name: 'Links' }).click();
  await sheet.getByRole('button', { name: '10 ml mehr' }).click();
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Abpumpen gespeichert · 70 ml')).toBeVisible();
  await expect(page.getByRole('listitem').last()).toHaveText('70 ml abgepumpt');

  // Last entry was pumping: the sheet opens on Abpumpen.
  await bottleButton(page).click();
  await expect(page.getByRole('dialog', { name: 'Abpumpen' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: 'Verlauf' }).click();
  await page.getByRole('button', { name: /Abpumpen links · 70 ml/ }).click();
  const editor = page.getByRole('dialog', { name: 'Eintrag bearbeiten' });
  await expect(editor.getByLabel('Menge in ml')).toHaveValue('70');
  await expect(editor.getByLabel('Ende')).toHaveCount(0);
  await editor.getByLabel('Menge in ml').fill('0');
  await editor.getByRole('button', { name: 'Speichern' }).click();
  await expect(editor.getByText('Bitte eine Menge zwischen 1 und 1000 ml angeben.')).toBeVisible();
  await editor.getByLabel('Menge in ml').fill('125');
  await editor.getByRole('button', { name: 'Rechts' }).click();
  await editor.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('button', { name: /Abpumpen rechts · 125 ml/ })).toBeVisible();
});

test('backfill a bottle from the history', async ({ page }) => {
  await page.getByRole('link', { name: 'Verlauf' }).click();
  await page.getByRole('button', { name: 'Eintrag nachtragen' }).click();
  const sheet = page.getByRole('dialog', { name: 'Eintrag nachtragen' });
  await sheet.getByRole('button', { name: 'Flasche' }).click();
  await expect(sheet.getByLabel('Zeitpunkt')).toBeVisible();
  await page.screenshot({ path: 'test-results/bottle-backfill.png', animations: 'disabled' });
  await sheet.getByLabel('Zeitpunkt').fill('2026-10-21T09:30');
  await sheet.getByLabel('Menge in ml').fill('90');
  await sheet.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('button', { name: /Flasche · 90 ml Muttermilch/ })).toBeVisible();
});

test('touch targets ≥ 44 px and nothing overflows the dock on a 360 px phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  for (const button of await page.locator('.dock button').all()) {
    const fits = await button.evaluate((el) => el.scrollWidth <= el.clientWidth);
    expect(fits, await button.innerText()).toBe(true);
  }
  await bottleButton(page).click();
  await expect(page.getByRole('dialog', { name: 'Flasche' })).toBeVisible();
  for (const target of await page.locator('dialog button:visible').all()) {
    const box = await target.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test('360 px phone: five counters in two rows without overlap, the running-feed button fits (0.14.1)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await bottleButton(page).click();
  await page.getByRole('dialog', { name: 'Flasche' }).getByRole('button', { name: 'Speichern' }).click();
  await bottleButton(page).click();
  await page.getByRole('dialog', { name: 'Flasche' }).getByRole('button', { name: 'Abpumpen' }).click();
  await page.getByRole('dialog', { name: 'Abpumpen' }).getByRole('button', { name: 'Speichern' }).click();
  await expect(page.locator('.stat')).toHaveCount(5);

  const boxes = await page.locator('.stat-label').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { text: el.textContent, left: r.left, right: r.right, top: r.top, bottom: r.bottom, fits: el.scrollWidth <= el.clientWidth };
    }),
  );
  for (const box of boxes) expect(box.fits, box.text ?? '').toBe(true);
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      const overlap = Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
      expect(overlap, `${a.text} / ${b.text}`).toBe(false);
    }

  await page.getByRole('button', { name: 'Stillen', exact: true }).click();
  await page.getByRole('button', { name: 'Zurück zu Heute' }).click();
  const running = page.locator('.dock-run-label');
  await expect(running).toHaveText('Läuft');
  expect(await running.evaluate((el) => el.closest('button')!.scrollWidth <= el.closest('button')!.clientWidth)).toBe(true);
});
