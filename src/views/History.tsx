import { useMemo, useState } from 'preact/hooks';
import { getEventsSince, hasEventsBefore, type BabyEvent, type Change } from '../data/events';
import { dayStats, feedSessions } from '../logic/stats';
import { addDays, formatDayHeading, formatDuration, HOUR, startOfDay } from '../logic/time';
import { t } from '../strings.de';
import { EventEditor, type EditorTarget } from '../ui/EventEditor';
import { EventRow } from '../ui/EventRow';
import { Icon } from '../ui/icons';
import { Snackbar, type SnackMessage } from '../ui/Snackbar';
import { useLive, useNow } from '../ui/hooks';

/** Days shown at first and added per "Ältere Einträge anzeigen". */
const DAYS_STEP = 14;
/** Longer gaps mean entries are missing; then no hint rather than "53 Std". */
const GAP_MAX = 12 * HOUR;
let snackId = 0;

interface Day {
  start: number;
  events: BabyEvent[];
}

function groupByDay(events: BabyEvent[]): Day[] {
  const days: Day[] = [];
  for (const event of events) {
    const start = startOfDay(event.start);
    const last = days.at(-1);
    if (last?.start === start) last.events.push(event);
    else days.push({ start, events: [event] });
  }
  return days;
}

/** History light (spec 6.6): list per day, newest first; edit, delete and backfill via sheet. */
export function History() {
  const now = useNow(30_000);
  const [dayCount, setDayCount] = useState(DAYS_STEP);
  const from = addDays(startOfDay(now), -(dayCount - 1));
  const data = useLive(async () => ({ events: await getEventsSince(from), older: await hasEventsBefore(from) }), [from]);
  const days = useMemo(() => groupByDay(data?.events ?? []), [data]);
  /** First event of each feeding → time since the start of the feeding before (start to start). */
  const gaps = useMemo(() => {
    const sessions = feedSessions(data?.events ?? []);
    const map = new Map<string, string>();
    sessions.forEach((session, i) => {
      const before = sessions[i - 1];
      const first = session.events[0];
      if (before && first && session.start - before.start < GAP_MAX) map.set(first.id, t.history.gap(formatDuration(session.start - before.start)));
    });
    return map;
  }, [data]);

  const [editor, setEditor] = useState<EditorTarget>();
  const [snack, setSnack] = useState<SnackMessage>();
  const done = (text: string) => (change: Change) => {
    setEditor(undefined);
    setSnack({ id: ++snackId, text, undo: change.undo });
  };

  return (
    <div class="history">
      <header class="history-head">
        <h1 class="screen-title">{t.history.title}</h1>
        <button type="button" class="round-btn round-btn--rose" aria-label={t.history.add} onClick={() => setEditor({ mode: 'add' })}>
          <Icon name="plus" size={22} />
        </button>
      </header>

      {data && days.length === 0 && !data.older && <p class="history-empty">{t.history.empty}</p>}

      {days.map((day) => {
        // All loaded events, not just this day's: a sleep over midnight counts on both days.
        const stats = dayStats(data?.events ?? [], day.start, addDays(day.start, 1), now);
        return (
          <section key={day.start} class="day" aria-labelledby={`day-${day.start}`}>
            <h2 id={`day-${day.start}`} class="day-title">
              {formatDayHeading(day.start, now)}
            </h2>
            <p class="day-summary">{t.history.daySummary(stats.feeds, stats.diapers, formatDuration(stats.sleepMs))}</p>
            <ul class="event-list">
              {day.events.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  sub={gaps.get(event.id)}
                  onOpen={(e) => setEditor({ mode: 'edit', event: e })}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {data?.older && (
        <button type="button" class="big-btn big-btn--white show-older" onClick={() => setDayCount((n) => n + DAYS_STEP)}>
          {t.history.showOlder}
        </button>
      )}

      <div class="snack-anchor">
        <Snackbar message={snack} onDone={() => setSnack(undefined)} />
      </div>

      <EventEditor
        target={editor}
        onClose={() => setEditor(undefined)}
        onSaved={done(t.history.saved)}
        onDeleted={done(t.history.deleted)}
      />
    </div>
  );
}
