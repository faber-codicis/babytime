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

/** Back to light (used by "Alle Daten löschen"). */
export function resetTheme(): void {
  saveThemeMode('light');
}
