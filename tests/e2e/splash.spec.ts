import { expect, test } from '@playwright/test';
import pkg from '../../package.json' with { type: 'json' };

test('static splash shows the version from package.json before JS runs', async ({ page }) => {
  // Block the app bundle so the static splash stays visible.
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.goto('/');
  const splash = page.locator('#splash');
  await expect(splash).toBeVisible();
  await expect(splash).toContainText('Baby Time');
  await expect(splash).toContainText(`Version ${pkg.version}`);
  await page.screenshot({ path: 'test-results/splash.png' });
});
