import { useMemo } from 'preact/hooks';
import { getEventsOverlapping } from '../data/events';
import { getTrackers, type Trackers } from '../data/trackers';
import { addDays, formatDuration, formatWeekdayShort, formatWeekRange, HOUR, startOfDay } from '../logic/time';
import { startOfWeek, weekStats, type WeekStats } from '../logic/week';
import { t } from '../strings.de';
import { useLive } from './hooks';
import { Icon, type IconName } from './icons';

type MetricKey = 'feeds' | 'diapers' | 'sleepMs' | 'bottleMl' | 'pumpMl';

interface Metric {
  key: MetricKey;
  tracker: keyof Trackers;
  title: string;
  icon: IconName;
  tone: 'rose' | 'peach' | 'lavender' | 'sky';
  /** Short value above a bar. */
  short: (v: number) => string;
  /** The average line ("Ø 7,4 pro Tag"). */
  average: (v: number) => string;
  /** Full sentence for screen readers. */
  a11y: (day: string, v: number) => string;
}

const w = t.week;
const METRICS: Metric[] = [
  { key: 'feeds', tracker: 'feed', title: w.feeds, icon: 'drop', tone: 'rose', short: String, average: (v) => w.count(v), a11y: w.feedsBar },
  { key: 'diapers', tracker: 'diaper', title: w.diapers, icon: 'diaper', tone: 'peach', short: String, average: (v) => w.count(v), a11y: w.diapersBar },
  {
    key: 'sleepMs',
    tracker: 'sleep',
    title: w.sleep,
    icon: 'moon',
    tone: 'lavender',
    // Whole hours fit above a narrow bar; the sentence and the average keep the minutes.
    short: (v) => (v >= HOUR ? `${Math.round(v / HOUR)}h` : v > 0 ? '<1h' : '0'),
    average: (v) => formatDuration(v),
    a11y: (day, v) => w.sleepBar(day, formatDuration(v)),
  },
  { key: 'bottleMl', tracker: 'bottle', title: w.bottle, icon: 'bottle', tone: 'sky', short: String, average: (v) => t.ml(Math.round(v)), a11y: w.bottleBar },
  { key: 'pumpMl', tracker: 'pump', title: w.pump, icon: 'pump', tone: 'sky', short: String, average: (v) => t.ml(Math.round(v)), a11y: w.pumpBar },
];

function Bars({ week, metric, today }: { week: WeekStats; metric: Metric; today: number }) {
  const values = week.days.map((d) => (d.stats ? d.stats[metric.key] : undefined));
  const max = Math.max(1, ...values.map((v) => v ?? 0));
  return (
    <ol class="week-bars">
      {week.days.map((day, i) => {
        const value = values[i];
        const label = formatWeekdayShort(day.start);
        const isToday = day.start === today;
        return (
          <li
            key={day.start}
            class={`week-bar${isToday ? ' is-today' : ''}${value === undefined ? ' is-future' : ''}`}
            aria-label={value === undefined ? w.futureBar(label) : metric.a11y(label, value)}
          >
            <span class="week-bar-value tabular" aria-hidden="true">
              {value === undefined ? '' : metric.short(value)}
            </span>
            <span class="week-bar-track" aria-hidden="true">
              {value !== undefined && value > 0 && (
                <span class={`week-bar-fill week-bar-fill--${metric.tone}`} style={{ height: `${(value / max) * 100}%` }} />
              )}
            </span>
            <span class="week-bar-day" aria-hidden="true">
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Week view of the history (0.9.0): one small bar chart per tracker, Monday to Sunday, with the daily average. */
export function WeekView({ weekStart, now, onWeek }: { weekStart: number; now: number; onWeek: (start: number) => void }) {
  const current = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const events = useLive(() => getEventsOverlapping(weekStart, weekEnd), [weekStart, weekEnd]);
  const trackers = useLive(getTrackers, []);
  const week = useMemo(() => (events ? weekStats(events, weekStart, now) : undefined), [events, weekStart, now]);

  const prevWeek = addDays(weekStart, -7);
  const named = weekStart === current ? w.thisWeek : weekStart === addDays(current, -7) ? w.lastWeek : undefined;
  const title = named ?? formatWeekRange(weekStart);
  const sub = named ? formatWeekRange(weekStart) : undefined;

  // Bottle and pump only in weeks with such entries (like the ml fields on Today); the others while their
  // tracker is on. A tracker that is switched off stays visible if the week has entries for it.
  const optional = (m: Metric) => m.key === 'bottleMl' || m.key === 'pumpMl';
  const shown = week
    ? METRICS.filter((m) => week.total[m.key] > 0 || (!optional(m) && (trackers?.[m.tracker] ?? true)))
    : [];
  const hasData = week ? METRICS.some((m) => week.total[m.key] > 0) : false;

  return (
    <div class="week">
      <div class="week-nav">
        <button type="button" class="round-btn round-btn--tint" aria-label={w.prev} onClick={() => onWeek(prevWeek)}>
          <Icon name="back" size={22} />
        </button>
        <div class="week-nav-text" aria-live="polite">
          <h2 class="week-title">{title}</h2>
          {sub && <p class="week-sub">{sub}</p>}
        </div>
        <button
          type="button"
          class="round-btn round-btn--tint"
          aria-label={w.next}
          disabled={weekStart >= current}
          onClick={() => onWeek(weekEnd)}
        >
          <Icon name="forward" size={22} />
        </button>
      </div>

      {week && !hasData && <p class="history-empty">{w.empty}</p>}

      {week &&
        hasData &&
        shown.map((metric) => (
          <section key={metric.key} class="week-card" aria-labelledby={`week-${metric.key}`}>
            <div class="week-card-head">
              <span class={`event-icon event-icon--${metric.tone}`} aria-hidden="true">
                <Icon name={metric.icon} size={20} />
              </span>
              <div>
                <h3 id={`week-${metric.key}`} class="week-card-title">
                  {metric.title}
                </h3>
                <p class="week-card-avg">{w.average(metric.average(week.average[metric.key]))}</p>
              </div>
            </div>
            <Bars week={week} metric={metric} today={startOfDay(now)} />
          </section>
        ))}
    </div>
  );
}
