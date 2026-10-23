import { defineConfig, devices } from '@playwright/test';

// Own port, so a manual `npm run preview` on 4173 can keep running alongside the tests.
const PORT = 4318;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    // Android stand-in: Chrome engine on a phone-sized viewport.
    { name: 'chromium', use: { ...devices['Pixel 7'] } },
    // iPhone stand-in: the Safari engine (WebKit). Not a real iPhone, but catches Safari-only issues.
    { name: 'webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
