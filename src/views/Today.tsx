import { useMemo, useRef, useState } from 'preact/hooks';
import { addBottle, addDiaper, addPump, getLatestAmounts, startFeed, toggleSleep, type DiaperKind } from '../data/events';
import { loadToday } from '../data/overview';
import type { Profile } from '../data/profile';
import { nextSide } from '../logic/nextSide';
import { dayStats } from '../logic/stats';
import { dayRange, formatTimer, MINUTE } from '../logic/time';
import { navigate } from '../router';
import { t } from '../strings.de';
import { BackupReminder } from '../ui/BackupReminder';
import { BottleSheet, type BottlePick } from '../ui/BottleSheet';
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
  const [bottleOpen, setBottleOpen] = useState(false);
  const latestAmounts = useLive(getLatestAmounts, []);
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
      // A running feed is returned unchanged, so this also leads back to the timer.
      await startFeed(nextSide(data?.lastFinishedFeed));
      navigate('feeding');
    });

  const onDiaper = (kind: DiaperKind, minutesAgo: number) =>
    once(async () => {
      setDiaperOpen(false);
      const change = await addDiaper(kind, Date.now() - minutesAgo * MINUTE);
      const text = minutesAgo ? t.snackbar.diaperSavedAgo(minutesAgo) : t.snackbar.diaperSaved;
      setSnack({ id: ++snackId, text, undo: change.undo });
    });

  const onBottle = (pick: BottlePick) =>
    once(async () => {
      setBottleOpen(false);
      const at = Date.now() - pick.minutesAgo * MINUTE;
      const change =
        pick.mode === 'bottle' ? await addBottle(pick.amountMl, pick.milk, at) : await addPump(pick.amountMl, pick.pumpSide, at);
      const text = pick.mode === 'bottle' ? t.snackbar.bottleSaved(pick.amountMl) : t.snackbar.pumpSaved(pick.amountMl);
      setSnack({ id: ++snackId, text, undo: change.undo });
    });

  const onSleep = () =>
    once(async () => {
      const change = await toggleSleep();
      const text = change.action === 'started' ? t.snackbar.sleepStarted : t.snackbar.sleepEnded;
      setSnack({ id: ++snackId, text, undo: change.undo });
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
          feedTimer={data?.runningFeed ? formatTimer(now - data.runningFeed.start) : undefined}
          onFeed={() => void onFeed()}
          onDiaper={() => setDiaperOpen(true)}
          onBottle={() => setBottleOpen(true)}
          onSleep={() => void onSleep()}
        />
      </div>
      <BottleSheet open={bottleOpen} latest={latestAmounts} onClose={() => setBottleOpen(false)} onSave={(pick) => void onBottle(pick)} />
      <DiaperSheet open={diaperOpen} onClose={() => setDiaperOpen(false)} onPick={(kind, minutesAgo) => void onDiaper(kind, minutesAgo)} />
    </div>
  );
}
