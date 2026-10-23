/**
 * Dark design on/off (default: light). Stored in localStorage, not IndexedDB, because
 * public/theme-init.js must read it synchronously before the first paint (also for the splash).
 * The key is repeated there – keep both in sync.
 */
export const THEME_KEY = 'babytime-theme';

export function isDarkTheme(): boolean {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark';
  } catch {
    return false; // storage blocked: stay light
  }
}

export function saveDarkTheme(on: boolean): void {
  try {
    if (on) localStorage.setItem(THEME_KEY, 'dark');
    else localStorage.removeItem(THEME_KEY);
  } catch {
    // Not persisted; the switch still applies until the app is closed.
  }
}
