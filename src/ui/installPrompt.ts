import { useEffect, useState } from 'preact/hooks';

/** Chrome/Edge (Android, desktop) only; not in the TypeScript DOM lib. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/**
 * Must run at startup: Chrome fires `beforeinstallprompt` once it considers the app installable,
 * possibly before the UI exists. The browser's own mini-infobar is replaced by our card.
 */
export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/** Shows the browser's install dialog; resolves after the user's choice. */
async function install(): Promise<void> {
  const event = deferred;
  if (!event) return;
  deferred = null; // a prompt event can be used only once
  notify();
  await event.prompt();
  await event.userChoice;
}

/** The install action while Chrome offers one, otherwise undefined. */
export function useInstallPrompt(): (() => Promise<void>) | undefined {
  const [available, setAvailable] = useState(deferred !== null);
  useEffect(() => {
    const update = () => setAvailable(deferred !== null);
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return available ? install : undefined;
}
