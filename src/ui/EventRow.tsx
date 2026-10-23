import type { BabyEvent } from '../data/events';
import { formatClock, formatDuration } from '../logic/time';
import { t } from '../strings.de';
import { Icon, type IconName } from './icons';

const LOOK: Record<BabyEvent['type'], { icon: IconName; tone: string }> = {
  feed: { icon: 'drop', tone: 'rose' },
  diaper: { icon: 'diaper', tone: 'peach' },
  sleep: { icon: 'moon', tone: 'lavender' },
};

/** "Stillen links · 18 Min", "Windel nass", "Schlaf · 2 Std 10 Min"; running events say "läuft". */
export function eventTitle(event: BabyEvent): string {
  const duration = event.end === undefined ? t.history.running : formatDuration(event.end - event.start);
  switch (event.type) {
    case 'feed':
      return t.history.rowFeed(event.side === 'right' ? t.side.right : t.side.left, duration);
    case 'diaper':
      return t.history.rowDiaper(t.diaper[event.diaper ?? 'wet']);
    case 'sleep':
      return t.history.rowSleep(duration);
  }
}

export function EventRow({ event, onOpen }: { event: BabyEvent; onOpen: (event: BabyEvent) => void }) {
  const look = LOOK[event.type];
  return (
    <li>
      <button type="button" class="event-row" onClick={() => onOpen(event)}>
        <span class={`event-icon event-icon--${look.tone}`} aria-hidden="true">
          <Icon name={look.icon} size={20} />
        </span>
        <span class="event-text">
          <span class="event-title">{eventTitle(event)}</span>
          {event.note && <span class="event-note">{event.note}</span>}
        </span>
        <span class="event-time tabular">{formatClock(event.start)}</span>
      </button>
    </li>
  );
}
