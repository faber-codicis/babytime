import { useState } from 'preact/hooks';
import { isDarkTheme, saveDarkTheme } from '../data/theme';

const THEME_COLOR = { light: '#B04A63', dark: '#150D10' } as const;

/** Sets the design on <html> (CSS tokens switch on [data-theme='dark']) and the browser bar colour. */
export function applyTheme(dark: boolean): void {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light);
}

/** The "Dunkles Design" switch: state, persisted and applied immediately. */
export function useDarkTheme(): [boolean, (on: boolean) => void] {
  const [dark, setDark] = useState(isDarkTheme);
  return [
    dark,
    (on) => {
      saveDarkTheme(on);
      applyTheme(on);
      setDark(on);
    },
  ];
}
