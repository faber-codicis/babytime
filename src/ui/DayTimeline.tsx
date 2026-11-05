import type { BabyEvent } from '../data/events';
import { timelineMarks } from '../logic/timeline';
import { t } from '../strings.de';

const HOURS = [0, 6, 12, 18, 24];
/** Today at a glance (0.7.0): a 24-hour bar with sleep spans, feeds, diapers and bottles, plus "now". */
export function DayTimeline(props: { events: readonly BabyEvent[] | undefined; dayStart: number; dayEnd: number; now: number }) {
  const marks = props.events ? timelineMarks(props.events, props.dayStart, props.dayEnd, props.now) : [];
  const nowPct = ((props.now - props.dayStart) / (props.dayEnd - props.dayStart)) * 100;
  return (
    <figure class="timeline" aria-label={t.today.timelineA11y}>
      <div class="timeline-bar">
        <span class="timeline-future" style={{ left: `${nowPct}%` }} />
        {marks.map((m) =>
          m.width === undefined ? (
            <span key={m.key} class={`timeline-dot timeline-dot--${m.kind}`} style={{ left: `${m.left}%` }} />
          ) : (
            <span key={m.key} class={`timeline-span timeline-span--${m.kind}`} style={{ left: `${m.left}%`, width: `${m.width}%` }} />
          ),
        )}
        <span class="timeline-now" style={{ left: `${nowPct}%` }} />
      </div>
      <div class="timeline-hours" aria-hidden="true">
        {HOURS.map((h) => (
          <span key={h} style={{ left: `${(h / 24) * 100}%` }}>
            {h}
          </span>
        ))}
      </div>
      <figcaption class="timeline-legend">
        <span class="legend legend--sleep">{t.today.legendSleep}</span>
        <span class="legend legend--feed">{t.today.legendFeed}</span>
        <span class="legend legend--diaper">{t.today.legendDiaper}</span>
        <span class="legend legend--bottle">{t.today.legendBottle}</span>
      </figcaption>
    </figure>
  );
}
