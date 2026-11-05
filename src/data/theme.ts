/**
 * Design choice: light (default), always dark, or dark at night only (20:00–07:00 local time, 0.7.0).
 * Stored in localStorage, not IndexedDB, because public/theme-init.js must read it synchronously
 * before the first paint (also for the splash). Key, values and night hours are repeated there –
 * keep both in sync.
 */
export const THEME_KEY = 'babytime-theme';

export type ThemeMode = 'light' | 'dark' | 'night';

/** Night from 20:00 to 07:00 local time: dark design, and the night view on Today. */
export const NIGHT_START_HOUR = 20;
export const NIGHT_END_HOUR = 7;

export function isNightTime(ts: number): boolean {
  const hour = new Date(ts).getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

export function getThemeMode(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'night' ? value : 'light';
  } catch {
    return 'light'; // storage blocked: stay light
  }
}

export function saveThemeMode(mode: ThemeMode): void {
  try {
    if (mode === 'light') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Not persisted; the choice still applies until the app is closed.
  }
}

/** Whether the dark design is shown at `ts` for `mode`. */
export function isDarkAt(mode: ThemeMode, ts: number): boolean {
  return mode === 'dark' || (mode === 'night' && isNightTime(ts));
}

/** Back to light and rosé (used by "Alle Daten löschen"). */
export function resetTheme(): void {
  saveThemeMode('light');
  saveAccent('rose');
}

// ---------------------------------------------------------------- accent colour

/**
 * Accent colour: rosé (default, the logo colour), green, purple, blue or orange. Like the design it lives in
 * localStorage, because public/theme-init.js sets it before the first paint. Key and values are repeated there.
 * The colours themselves are CSS tokens in src/styles/tokens.css ([data-accent] on <html>).
 */
export const ACCENT_KEY = 'babytime-accent';

export const ACCENTS = ['rose', 'green', 'purple', 'blue', 'orange'] as const;
export type Accent = (typeof ACCENTS)[number];

export function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && (ACCENTS as readonly string[]).includes(value);
}

export function getAccent(): Accent {
  try {
    const value = localStorage.getItem(ACCENT_KEY);
    return isAccent(value) ? value : 'rose';
  } catch {
    return 'rose';
  }
}

export function saveAccent(accent: Accent): void {
  try {
    if (accent === 'rose') localStorage.removeItem(ACCENT_KEY);
    else localStorage.setItem(ACCENT_KEY, accent);
  } catch {
    // Not persisted; the choice still applies until the app is closed.
  }
}
