import { useEffect, useState } from 'preact/hooks';
import { getThemeMode, isDarkAt, isNightTime, saveThemeMode, type ThemeMode } from '../data/theme';

const THEME_COLOR = { light: '#B04A63', dark: '#150D10' } as const;

/** Sets the design on <html> (CSS tokens switch on [data-theme='dark']) and the browser bar colour. */
export function applyTheme(dark: boolean): void {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light);
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
