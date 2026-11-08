import type { BabyEvent } from '../data/events';
import { DEFAULT_TRACKERS, type Trackers } from '../data/trackers';
import { timelineMarks } from '../logic/timeline';
import { t } from '../strings.de';

const HOURS = [0, 6, 12, 18, 24];
/** An hour label closer than this to "jetzt" (in % of the bar) makes room for it. */
const NOW_GAP_PCT = 7;
/** Today at a glance (0.7.0): a 24-hour bar with sleep spans, feeds, diapers and bottles, plus "now". */
export function DayTimeline(props: {
  events: readonly BabyEvent[] | undefined;
  show?: Trackers;
  dayStart: number;
  dayEnd: number;
  now: number;
}) {
  const show = props.show ?? DEFAULT_TRACKERS;
  // Only switched-on trackers (Einstellungen); bottle and pump share one mark.
  const events = props.events?.filter((e) => show[e.type]);
  const marks = events ? timelineMarks(events, props.dayStart, props.dayEnd, props.now) : [];
  const nowPct = ((props.now - props.dayStart) / (props.dayEnd - props.dayStart)) * 100;
  return (
    <figure class="timeline" aria-label={t.today.timelineA11y}>
      <div class="timeline-track">
        <div class="timeline-bar">
          <span class="timeline-future" style={{ left: `${nowPct}%` }} />
          {marks.map((m) =>
            m.width === undefined ? (
              <span key={m.key} class={`timeline-dot timeline-dot--${m.kind}`} style={{ left: `${m.left}%` }} />
            ) : (
              <span key={m.key} class={`timeline-span timeline-span--${m.kind}`} style={{ left: `${m.left}%`, width: `${m.width}%` }} />
            ),
          )}
        </div>
        {/* Outside the bar, so it can reach above and below it (0.12.0). */}
        <span class="timeline-now" style={{ left: `${nowPct}%` }} />
      </div>
      <div class="timeline-hours" aria-hidden="true">
        {HOURS.map((h) => (
          <span
            key={h}
            class={Math.abs((h / 24) * 100 - nowPct) < NOW_GAP_PCT ? 'is-hidden' : undefined}
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h}
          </span>
        ))}
        <span class="timeline-now-label" style={{ left: `${Math.min(Math.max(nowPct, 4), 96)}%` }}>
          {t.today.timelineNow}
        </span>
      </div>
      <figcaption class="timeline-legend">
        {show.sleep && <span class="legend legend--sleep">{t.today.legendSleep}</span>}
        {show.feed && <span class="legend legend--feed">{t.today.legendFeed}</span>}
        {show.diaper && <span class="legend legend--diaper">{t.today.legendDiaper}</span>}
        {(show.bottle || show.pump) && (
          <span class="legend legend--bottle">
            {show.bottle && show.pump ? t.today.legendBottle : show.bottle ? t.today.actionBottle : t.today.actionPump}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
