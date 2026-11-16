import { render } from 'preact';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/today.css';
import './styles/feeding.css';
import './styles/history.css';
import './styles/onboarding.css';
import './styles/whatsnew.css';
import './styles/settings.css';
import './styles/tutorial.css';
import { App } from './app';
import { openDb } from './data/db';
import { watchForUpdates } from './ui/appUpdate';
import { captureInstallPrompt } from './ui/installPrompt';

captureInstallPrompt();
watchForUpdates();

// No zooming (owner's wish, 0.8.0): the viewport says user-scalable=no, but iOS Safari ignores it,
// so its pinch gesture is blocked here; double-tap zoom is off via touch-action in base.css.
for (const type of ['gesturestart', 'gesturechange']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}

const SPLASH_MAX_MS = 1200;

function hideSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash || splash.classList.contains('is-hidden')) return;
  splash.classList.add('is-hidden');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) splash.remove();
  else window.setTimeout(() => splash.remove(), 200);
}

async function boot(): Promise<void> {
  render(<App />, document.getElementById('app')!);
  // The splash ends as soon as the database is ready, never later than SPLASH_MAX_MS.
  const timeout = window.setTimeout(hideSplash, SPLASH_MAX_MS);
  try {
    await openDb();
  } finally {
    window.clearTimeout(timeout);
    hideSplash();
  }
}

void boot();
