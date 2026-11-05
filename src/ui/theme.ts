import { useEffect, useState } from 'preact/hooks';
import { getAccent, getThemeMode, isDarkAt, isNightTime, saveAccent, saveThemeMode, type Accent, type ThemeMode } from '../data/theme';

/** Browser bar colour: the accent in the light design (same as --rose in tokens.css), the background in dark. */
export const BAR_COLOR: Record<Accent, string> = {
  rose: '#B04A63',
  green: '#2F7A55',
  purple: '#7353B8',
  blue: '#2F6AA3',
  orange: '#B0521F',
};
const DARK_BAR = '#150D10';

/** Sets the design on <html> (CSS tokens switch on [data-theme='dark']) and the browser bar colour. */
export function applyTheme(dark: boolean): void {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? DARK_BAR : BAR_COLOR[getAccent()]);
}

/** Sets the accent on <html> (CSS tokens switch on [data-accent]); rosé is the default without attribute. */
export function applyAccent(accent: Accent): void {
  if (accent === 'rose') delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = accent;
}

/** Applies the saved choice for this moment. */
export function applyThemeNow(): void {
  applyTheme(isDarkAt(getThemeMode(), Date.now()));
}

/**
 * Once in the app root: with "Nachts automatisch" the design follows the clock while the app is open –
 * checked every minute and whenever the app becomes visible again.
 */
export function useAutoTheme(): void {
  useEffect(() => {
    const timer = window.setInterval(applyThemeNow, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') applyThemeNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}

/** The design choice in Einstellungen: state, persisted and applied immediately. */
export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setMode] = useState(getThemeMode);
  return [
    mode,
    (next) => {
      saveThemeMode(next);
      applyThemeNow();
      setMode(next);
    },
  ];
}

/** Night view on Today: "Nachts automatisch" is on and it is night now. */
export function isNightView(now: number): boolean {
  return getThemeMode() === 'night' && isNightTime(now);
}

/** The accent choice in Einstellungen: state, persisted and applied immediately (also the browser bar). */
export function useAccent(): [Accent, (accent: Accent) => void] {
  const [accent, setAccent] = useState(getAccent);
  return [
    accent,
    (next) => {
      saveAccent(next);
      applyAccent(next);
      applyThemeNow();
      setAccent(next);
    },
  ];
}
