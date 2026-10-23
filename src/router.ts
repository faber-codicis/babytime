import { useEffect, useState } from 'preact/hooks';

export type Route = 'today' | 'history' | 'settings' | 'feeding' | 'whatsnew';

const HASHES: Record<Route, string> = {
  today: '#/',
  history: '#/verlauf',
  settings: '#/einstellungen',
  feeding: '#/stillen',
  whatsnew: '#/neu',
};

/** Back from a sub page (e.g. "Was ist neu"): browser history if there is one, otherwise Today. */
export function goBack(): void {
  if (history.length > 1) history.back();
  else navigate('today', { replace: true });
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
