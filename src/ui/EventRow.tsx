import type { BabyEvent } from '../data/events';
import { formatClock, formatDuration } from '../logic/time';
import { isTimed } from '../logic/validate';
import { t } from '../strings.de';
import { Icon, type IconName } from './icons';

const LOOK: Record<BabyEvent['type'], { icon: IconName; tone: string }> = {
  feed: { icon: 'drop', tone: 'rose' },
  diaper: { icon: 'diaper', tone: 'peach' },
  sleep: { icon: 'moon', tone: 'lavender' },
  bottle: { icon: 'bottle', tone: 'sky' },
  pump: { icon: 'pump', tone: 'sky' },
};

/** "Stillen links · 18 Min", "Windel nass", "Schlaf · 2 Std 10 Min", "Flasche · 90 ml Muttermilch", "Abpumpen beide · 120 ml"; running events get no duration (badge instead). */
export function eventTitle(event: BabyEvent): string {
  const duration = event.end === undefined ? undefined : formatDuration(event.end - event.start);
  switch (event.type) {
    case 'feed':
      return t.history.rowFeed(event.side === 'right' ? t.side.right : t.side.left, duration);
    case 'diaper':
      return t.history.rowDiaper(t.diaper[event.diaper ?? 'wet']);
    case 'sleep':
      return t.history.rowSleep(duration);
    case 'bottle':
      return t.history.rowBottle(t.ml(event.amountMl ?? 0), t.milk[event.milk ?? 'breast']);
    case 'pump':
      return t.history.rowPump(t.pumpSide[event.pumpSide ?? 'both'], t.ml(event.amountMl ?? 0));
  }
}

/** One history row; `sub` is an optional second line (e.g. the gap since the feeding before). */
export function EventRow({ event, sub, onOpen }: { event: BabyEvent; sub?: string | undefined; onOpen: (event: BabyEvent) => void }) {
  const look = LOOK[event.type];
  const running = isTimed(event.type) && event.end === undefined;
  return (
    <li>
      <button type="button" class="event-row" onClick={() => onOpen(event)}>
        <span class={`event-icon event-icon--${look.tone}`} aria-hidden="true">
          <Icon name={look.icon} size={20} />
        </span>
        <span class="event-text">
          <span class="event-title">
            {eventTitle(event)}
            {running && ' '}
            {running && <span class={`run-badge run-badge--${look.tone}`}>{t.history.running}</span>}
          </span>
          {sub && <span class="event-sub">{sub}</span>}
          {event.note && <span class="event-note">{event.note}</span>}
        </span>
        <span class="event-time tabular">{formatClock(event.start)}</span>
      </button>
    </li>
  );
}
