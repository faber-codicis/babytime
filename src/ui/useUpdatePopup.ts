import { useEffect, useRef, useState } from 'preact/hooks';
import { changelog, type ChangelogEntry } from '../changelog';
import { getLastSeenVersion, setLastSeenVersion } from '../data/appState';
import { navigate, type Route } from '../router';
import { decideUpdate } from '../version';

/**
 * Spec 6.9: once onboarded, compare lastSeenVersion with the running version. The popup only opens
 * on Today (never over a running feed), at most once per start; every way of closing it marks the
 * version as seen right away.
 */
export function useUpdatePopup(onboarded: boolean, route: Route) {
  const [pending, setPending] = useState<ChangelogEntry[]>();
  const [visible, setVisible] = useState(false);
  const shownThisStart = useRef(false);

  useEffect(() => {
    if (!onboarded) return;
    let cancelled = false;
    void getLastSeenVersion().then((lastSeen) => {
      if (cancelled) return;
      const decision = decideUpdate(lastSeen, __APP_VERSION__, changelog);
      if (decision.kind === 'remember') void setLastSeenVersion(__APP_VERSION__);
      if (decision.kind === 'popup') setPending(decision.entries);
    });
    return () => {
      cancelled = true;
    };
  }, [onboarded]);

  useEffect(() => {
    if (pending && route === 'today' && !shownThisStart.current) {
      shownThisStart.current = true;
      setVisible(true);
    }
  }, [pending, route]);

  /** Stores "seen" first, then closes – so a closed popup never comes back, even if the app is killed right away. */
  const close = async () => {
    await setLastSeenVersion(__APP_VERSION__);
    setVisible(false);
    setPending(undefined);
  };

  return {
    entries: visible ? pending : undefined,
    dismiss: () => void close(),
    showAll: () => {
      void close();
      navigate('whatsnew');
    },
  };
}
