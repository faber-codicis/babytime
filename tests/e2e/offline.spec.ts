import { expect, test } from '@playwright/test';

test('starts offline after the first visit, without CSP violations or external requests', async ({
  page,
  context,
  baseURL,
}) => {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(msg.text());
  });
  page.on('request', (req) => {
    if (!req.url().startsWith(baseURL!) && !req.url().startsWith('data:')) problems.push(`external: ${req.url()}`);
  });

  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self'");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Splash is removed once the app is up.
  await expect(page.locator('#splash')).toHaveCount(0);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#app')).not.toBeEmpty();
  await expect(page.locator('#splash')).toHaveCount(0);

  expect(problems).toEqual([]);
});
