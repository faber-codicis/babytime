import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('0.0.0-test'),
    __BUILD_TIME__: JSON.stringify(0),
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // Fixed zone so day boundaries and the DST switch (2026-10-25) are tested deterministically.
    env: { TZ: 'Europe/Vienna' },
    setupFiles: ['tests/unit/setup.ts'],
  },
});
