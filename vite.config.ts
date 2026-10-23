import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

const { version } = pkg;

/** Global headers (the `/*` block) from public/_headers, so `vite preview` enforces the same CSP as Cloudflare. */
function globalHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  let inGlobalBlock = false;
  for (const line of readFileSync(new URL('./public/_headers', import.meta.url), 'utf8').split(/\r?\n/)) {
    if (!line.startsWith(' ')) {
      inGlobalBlock = line.trim() === '/*';
      continue;
    }
    const match = inGlobalBlock ? /^\s+([^:]+):\s*(.+)$/.exec(line) : null;
    if (match) headers[match[1]!] = match[2]!;
  }
  return headers;
}

/** Writes the version into the static splash in index.html at build time (no runtime request). */
function htmlVersion(): Plugin {
  return {
    name: 'babytime-html-version',
    transformIndexHtml: (html) => html.replaceAll('%APP_VERSION%', version),
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    // Build time next to the version, so a fresh upload is recognisable on the phone.
    __BUILD_TIME__: JSON.stringify(Date.now()),
  },
  preview: {
    headers: globalHeaders(),
  },
  plugins: [
    preact(),
    htmlVersion(),
    VitePWA({
      registerType: 'autoUpdate',
      // External registerSW.js instead of an inline script, so the CSP can keep script-src 'self'.
      injectRegister: 'script',
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'Baby Time',
        short_name: 'Baby Time',
        lang: 'de',
        // Fullscreen hides the Android system bars (the light navigation strip); other platforms fall back to standalone.
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        start_url: '/',
        scope: '/',
        theme_color: '#B04A63',
        // Android's own start screen (icon on this colour) cannot follow the light/dark switch; a deep rosé
        // (the dark --rose-tint) is easy on the eyes at night and still fine by day.
        background_color: '#3D2129',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // A new version takes over right after download; the app then offers "Update bereit" (no auto reload).
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});
