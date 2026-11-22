import { useEffect, useState } from 'preact/hooks';

export type Route =
  | 'today'
  | 'history'
  | 'milestones'
  | 'settings'
  | 'settingsTrackers'
  | 'settingsLook'
  | 'settingsData'
  | 'settingsAbout'
  | 'feeding'
  | 'whatsnew';

/** The settings sub pages (0.17.0): they keep the tab bar with "Einstellungen" marked. */
export type SettingsPage = Extract<Route, `settings${string}`>;

export function isSettingsPage(route: Route): route is SettingsPage {
  return route.startsWith('settings');
}

const HASHES: Record<Route, string> = {
  today: '#/',
  history: '#/verlauf',
  milestones: '#/meilensteine',
  settings: '#/einstellungen',
  settingsTrackers: '#/einstellungen/erfassen',
  settingsLook: '#/einstellungen/darstellung',
  settingsData: '#/einstellungen/daten',
  settingsAbout: '#/einstellungen/app',
  feeding: '#/stillen',
  whatsnew: '#/neu',
};

/** Back from a sub page (e.g. "Was ist neu"): browser history if there is one, otherwise `fallback` (Today). */
export function goBack(fallback: Route = 'today'): void {
  if (history.length > 1) history.back();
  else navigate(fallback, { replace: true });
}

export function hashOf(route: Route): string {
  return HASHES[route];
}

export function parseHash(hash: string): Route {
  const match = (Object.keys(HASHES) as Route[]).find((route) => route !== 'today' && HASHES[route] === hash);
  return match ?? 'today';
}

export function navigate(route: Route, { replace = false } = {}): void {
  const hash = HASHES[route];
  if (location.hash === hash) return;
  if (replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = hash;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
