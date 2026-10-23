import { expect, test } from '@playwright/test';

test('Chrome reports the app as installable (manifest, icons, service worker)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'installability check uses the Chrome DevTools Protocol');
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  const manifest = await cdp.send('Page.getAppManifest');
  console.log('manifest url:', manifest.url, 'errors:', JSON.stringify(manifest.errors));
  expect(installabilityErrors).toEqual([]);
});
