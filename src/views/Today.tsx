import { useMemo, useRef, useState } from 'preact/hooks';
import { addDiaper, startFeed, toggleSleep, type DiaperKind } from '../data/events';
import { loadToday } from '../data/overview';
import type { Profile } from '../data/profile';
import { nextSide } from '../logic/nextSide';
import { dayStats } from '../logic/stats';
import { dayRange } from '../logic/time';
import { navigate } from '../router';
import { t } from '../strings.de';
import { BackupReminder } from '../ui/BackupReminder';
import { Chips } from '../ui/Chips';
import { DiaperSheet } from '../ui/DiaperSheet';
import { DockButtons } from '../ui/DockButtons';
import { Header } from '../ui/Header';
import { HeroCard } from '../ui/HeroCard';
import { InstallHint } from '../ui/InstallHint';
import { Snackbar, type SnackMessage } from '../ui/Snackbar';
import { StatusCards } from '../ui/StatusCards';
import { useLive, useNow } from '../ui/hooks';

let snackId = 0;

export function Today({ profile }: { profile: Profile }) {
  // The query only depends on the local day; it re-runs at midnight and on every data change.
  const [dayStart, dayEnd] = dayRange(useNow(30_000));
  const data = useLive(() => loadToday(dayStart, dayEnd), [dayStart, dayEnd]);
  // A running feed shows a live timer on the hero card; otherwise every 30 s is enough (spec 6.2).
  const now = useNow(data?.runningFeed ? 1_000 : 30_000);

  const stats = useMemo(
    () => (data ? dayStats(data.dayEvents, dayStart, dayEnd, now) : undefined),
    [data, dayStart, dayEnd, now],
  );

  const [diaperOpen, setDiaperOpen] = useState(false);
  const [snack, setSnack] = useState<SnackMessage>();
  const busy = useRef(false);

  /** Runs one write at a time, so a double tap on Schlaf cannot start and end at once. */
  const once = async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await action();
    } finally {
      busy.current = false;
    }
  };

  const onFeed = () =>
    once(async () => {
      await startFeed(nextSide(data?.lastFinishedFeed));
      navigate('feeding');
    });

  const onSleep = () =>
    once(async () => {
      const change = await toggleSleep();
      const text = change.action === 'started' ? t.snackbar.sleepStarted : t.snackbar.sleepEnded;
      setSnack({ id: ++snackId, text, undo: change.undo });
    });

  const onDiaper = (kind: DiaperKind) =>
    once(async () => {
      setDiaperOpen(false);
      const change = await addDiaper(kind);
      setSnack({ id: ++snackId, text: t.snackbar.diaperSaved, undo: change.undo });
    });

  return (
    <div class="today">
      <InstallHint />
      <Header profile={profile} now={now} />
      <BackupReminder
        now={now}
        feeding={Boolean(data?.runningFeed)}
        onMessage={(text) => setSnack({ id: ++snackId, text })}
      />
      <HeroCard data={data} now={now} />
      <StatusCards data={data} now={now} />
      <Chips stats={stats} />
      <div class="dock-area">
        <Snackbar message={snack} onDone={() => setSnack(undefined)} />
        <DockButtons
          sleeping={Boolean(data?.runningSleep)}
          onFeed={() => void onFeed()}
          onDiaper={() => setDiaperOpen(true)}
          onSleep={() => void onSleep()}
        />
      </div>
      <DiaperSheet open={diaperOpen} onClose={() => setDiaperOpen(false)} onPick={(kind) => void onDiaper(kind)} />
    </div>
  );
}
