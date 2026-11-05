import { useMemo, useRef, useState } from 'preact/hooks';
import { addBottle, addDiaper, addPump, getLatestAmounts, startFeed, toggleSleep, type DiaperKind } from '../data/events';
import { loadToday } from '../data/overview';
import { DEFAULT_TRACKERS, getTrackers } from '../data/trackers';
import type { Profile } from '../data/profile';
import { nextSide } from '../logic/nextSide';
import { dayStats } from '../logic/stats';
import { dayRange, formatTimer, HOUR, MINUTE } from '../logic/time';
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
import { DayTimeline } from '../ui/DayTimeline';
import { isNightView } from '../ui/theme';
import { useLive, useNow } from '../ui/hooks';
import { NightView } from './NightView';

let snackId = 0;

/**
 * Sun button in the night view: the normal Today until the night is over (or the app restarts).
 * Kept outside the component, so switching tabs does not bring the night view back.
 */
let dayViewChosenAt: number | undefined;
const DAY_VIEW_MS = 12 * HOUR;

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
  const show = useLive(getTrackers, []) ?? DEFAULT_TRACKERS;
  const [snack, setSnack] = useState<SnackMessage>();
  const busy = useRef(false);
  const [, rerender] = useState(0);
  const dayViewChosen = dayViewChosenAt !== undefined && now - dayViewChosenAt < DAY_VIEW_MS;
  const nightTime = isNightView(now);
  // The night view is built around feeding; without the Stillen tracker Today stays as it is.
  const night = nightTime && !dayViewChosen && show.feed;
  const chooseDayView = (day: boolean) => {
    dayViewChosenAt = day ? Date.now() : undefined;
    rerender((n) => n + 1);
  };

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

  const sheets = (
    <>
      <BottleSheet open={bottleOpen} latest={latestAmounts} modes={{ bottle: show.bottle, pump: show.pump }} onClose={() => setBottleOpen(false)} onSave={(pick) => void onBottle(pick)} />
      <DiaperSheet open={diaperOpen} onClose={() => setDiaperOpen(false)} onPick={(kind, minutesAgo) => void onDiaper(kind, minutesAgo)} />
    </>
  );

  if (night) {
    return (
      <>
        <NightView
          data={data}
          now={now}
          show={show}
          onFeed={() => void onFeed()}
          onDiaper={() => setDiaperOpen(true)}
          onBottle={() => setBottleOpen(true)}
          onSleep={() => void onSleep()}
          onDayView={() => chooseDayView(true)}
        />
        <div class="snack-anchor">
          <Snackbar message={snack} onDone={() => setSnack(undefined)} />
        </div>
        {sheets}
      </>
    );
  }

  return (
    <div class="today">
      <InstallHint />
      <Header profile={profile} now={now} onNightView={nightTime ? () => chooseDayView(false) : undefined} />
      <BackupReminder
        now={now}
        feeding={Boolean(data?.runningFeed)}
        onMessage={(text) => setSnack({ id: ++snackId, text })}
      />
      {show.feed && <HeroCard data={data} now={now} />}
      <StatusCards data={data} now={now} diaper={show.diaper} sleep={show.sleep} />
      <Chips stats={stats} show={show} />
      {show.timeline && <DayTimeline events={data?.dayEvents} show={show} dayStart={dayStart} dayEnd={dayEnd} now={now} />}
      <div class="dock-area">
        <Snackbar message={snack} onDone={() => setSnack(undefined)} />
        <DockButtons
          show={show}
          sleeping={Boolean(data?.runningSleep)}
          feedTimer={data?.runningFeed ? formatTimer(now - data.runningFeed.start) : undefined}
          onFeed={() => void onFeed()}
          onDiaper={() => setDiaperOpen(true)}
          onBottle={() => setBottleOpen(true)}
          onSleep={() => void onSleep()}
        />
      </div>
      {sheets}
    </div>
  );
}
