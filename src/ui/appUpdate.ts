import { useEffect, useState } from 'preact/hooks';

/**
 * Update state of the installed app (0.4.0). The service worker activates a new version right after
 * downloading it (skipWaiting); the page keeps running the old code until it is restarted.
 * - idle: nothing known · checking/loading: "Nach Update suchen" running
 * - latest: checked, nothing new · offline: check not possible · ready: new version active, restart to use it
 */
export type UpdateStatus = 'idle' | 'checking' | 'loading' | 'latest' | 'offline' | 'ready';

/** How long "Nach Update suchen" waits for a found version to finish downloading. */
const LOAD_TIMEOUT_MS = 20_000;

let status: UpdateStatus = 'idle';
const listeners = new Set<() => void>();

function setStatus(next: UpdateStatus): void {
  if (status === 'ready' && next !== 'ready') return; // a ready update stays ready until the restart
  status = next;
  listeners.forEach((listener) => listener());
}

/**
 * Must run at startup: a controller change only means "new version" if a service worker already
 * controlled this page (on the very first visit the first worker takes over – that is no update).
 */
export function watchForUpdates(): void {
  if (!('serviceWorker' in navigator)) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) setStatus('ready');
  });
}

function waitForReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      listeners.delete(check);
      resolve(false);
    }, LOAD_TIMEOUT_MS);
    const check = () => {
      if (status !== 'ready') return;
      window.clearTimeout(timer);
      listeners.delete(check);
      resolve(true);
    };
    listeners.add(check);
  });
}

/** "Nach Update suchen": asks the own server for a newer sw.js (no other requests). */
export async function checkForUpdate(): Promise<void> {
  if (status === 'ready' || status === 'checking' || status === 'loading') return;
  if (!('serviceWorker' in navigator) || !navigator.onLine) {
    setStatus('offline');
    return;
  }
  setStatus('checking');
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      setStatus('latest');
      return;
    }
    await registration.update();
    if (registration.installing || registration.waiting) {
      setStatus('loading');
      if (!(await waitForReady())) setStatus('offline');
    } else {
      setStatus('latest');
    }
  } catch {
    setStatus('offline');
  }
}

/** Starts the new version – only ever on the user's tap, never automatically. */
export function restartApp(): void {
  location.reload();
}

export function useAppUpdate(): UpdateStatus {
  const [current, setCurrent] = useState(status);
  useEffect(() => {
    const update = () => setCurrent(status);
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return current;
}
