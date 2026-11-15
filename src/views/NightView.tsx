import type { TodayData } from '../data/overview';
import type { Side } from '../data/events';
import type { Trackers } from '../data/trackers';
import { nextSide } from '../logic/nextSide';
import { HOUR, formatClock, formatHoursMinutes, formatTimer } from '../logic/time';
import { t } from '../strings';
import { Icon } from '../ui/icons';

/** One ring lap = 3 hours since the last feed: a full ring means "about time again". */
const RING_MS = 3 * HOUR;
const SIZE = 260;
const STROKE = 14;
const R = SIZE / 2 - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

const sideName = (side: Side | undefined) => (side === 'right' ? t.side.right : t.side.left);

interface NightViewProps {
  data: TodayData | undefined;
  now: number;
  /** Switched-on trackers; the night view only appears with Stillen on. */
  show: Trackers;
  onFeed: () => void;
  onDiaper: () => void;
  onBottle: () => void;
  onSleep: () => void;
  /** Sun button: back to the normal Today for this night. */
  onDayView: () => void;
}

/**
 * Night view on Today (0.7.0, mockup "Übersicht (Nachtmodus)"): with "Nachts automatisch" between
 * 20:00 and 07:00. Only what counts at 3 a.m.: time since the last feed, diaper, sleep, and big buttons.
 */
export function NightView({ data, now, show, onFeed, onDiaper, onBottle, onSleep, onDayView }: NightViewProps) {
  const running = data?.runningFeed;
  const session = data?.lastFeedSession;
  const next = nextSide(data?.lastFinishedFeed);

  let label: string = t.night.lastFed;
  let big = '–';
  let sub = '';
  let progress = 0;
  if (running) {
    label = t.today.feedingNow;
    big = formatTimer(now - running.start);
    sub = sideName(running.side);
    progress = 1;
  } else if (session?.end !== undefined) {
    big = formatHoursMinutes(now - session.end);
    sub = t.night.hoursSide(sideName(session.lastSide));
    progress = Math.min(1, (now - session.end) / RING_MS);
  }

  const diaper = data?.lastDiaper;
  const sleeping = data?.runningSleep;
  const sleepSince = sleeping?.start ?? data?.lastFinishedSleep?.end;

  const ring = (
    <div class="night-ring">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
        <circle class="night-ring-track" cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke-width={STROKE} />
        <circle
          class="night-ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke-width={STROKE}
          stroke-linecap="round"
          stroke-dasharray={CIRCUMFERENCE}
          stroke-dashoffset={CIRCUMFERENCE * (1 - progress)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div class="night-ring-center">
        <p class="night-ring-label">{label}</p>
        <p class="night-ring-big">{data ? big : ' '}</p>
        <p class="night-ring-sub">{sub}</p>
      </div>
    </div>
  );

  return (
    <div class="night">
      <header class="night-head">
        <div>
          <p class="night-title">{t.night.title}</p>
          <p class="night-clock">{formatClock(now)}</p>
        </div>
        <button type="button" class="round-btn night-sun" aria-label={t.night.dayView} onClick={onDayView}>
          <Icon name="sun" size={22} />
        </button>
      </header>

      {running ? (
        <a class="night-ring-link" href="#/stillen" aria-label={t.night.toTimer}>
          {ring}
        </a>
      ) : (
        <section aria-label={t.night.lastFed}>{ring}</section>
      )}

      <div class="night-cards">
        {show.diaper && (
          <section class="night-card" aria-label={t.today.diaper}>
            <p class="night-card-label">{t.today.diaper}</p>
            <p class="night-card-big">{diaper ? t.night.hours(formatHoursMinutes(now - diaper.start)) : '–'}</p>
          </section>
        )}
        {show.sleep && (
          <section class="night-card" aria-label={t.today.sleep}>
            <p class="night-card-label">{sleeping ? t.night.asleepSince : t.night.awakeSince}</p>
            <p class="night-card-big">{sleepSince !== undefined ? t.night.hours(formatHoursMinutes(now - sleepSince)) : '–'}</p>
          </section>
        )}
      </div>

      <div class="night-actions">
        <button type="button" class="night-feed" onClick={onFeed}>
          <Icon name="drop" size={24} />
          {running ? t.night.feedRunning(formatTimer(now - running.start)) : t.night.feedStart(sideName(next))}
        </button>
        <div class="night-row">
          {show.diaper && (
            <button type="button" class="night-btn" onClick={onDiaper}>
              {t.today.actionDiaper}
            </button>
          )}
          {(show.bottle || show.pump) && (
            <button
              type="button"
              class="night-btn"
              aria-label={show.bottle && show.pump ? t.today.actionBottleA11y : undefined}
              onClick={onBottle}
            >
              {show.bottle ? t.today.actionBottle : t.today.actionPump}
            </button>
          )}
          {show.sleep && (
            <button type="button" class="night-btn" onClick={onSleep}>
              {sleeping ? t.today.actionWake : t.today.actionSleep}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
