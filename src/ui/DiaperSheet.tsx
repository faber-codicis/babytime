import { useEffect, useState } from 'preact/hooks';
import type { DiaperKind } from '../data/events';
import { t } from '../strings';
import { Icon, type IconName } from './icons';
import { Sheet } from './Sheet';

const KINDS: { kind: DiaperKind; icon: IconName }[] = [
  { kind: 'wet', icon: 'drop' },
  { kind: 'dirty', icon: 'dirty' },
  { kind: 'both', icon: 'both' },
];

/** Minutes back for a diaper noticed a little late; "jetzt" stays the default, so it is still 2 taps. */
const WHEN = [0, 5, 15, 30];

/** Three big buttons; one tap saves (at "jetzt" or the chosen time) and closes (spec 6.4). */
export function DiaperSheet(props: {
  open: boolean;
  onClose: () => void;
  onPick: (kind: DiaperKind, minutesAgo: number) => void;
}) {
  const [minutesAgo, setMinutesAgo] = useState(0);

  // Every opening starts at "jetzt".
  useEffect(() => {
    if (props.open) setMinutesAgo(0);
  }, [props.open]);

  return (
    <Sheet open={props.open} onClose={props.onClose} labelledBy="diaper-sheet-title">
      <div class="sheet-head">
        <span class="icon-bubble icon-bubble--peach">
          <Icon name="diaper" size={18} />
        </span>
        <h2 id="diaper-sheet-title" class="sheet-title">
          {t.diaperSheet.title}
        </h2>
      </div>
      <div class="when-pills" role="group" aria-label={t.diaperSheet.whenA11y}>
        {WHEN.map((m) => (
          <button
            key={m}
            type="button"
            class={`when-pill${m === minutesAgo ? ' is-active' : ''}`}
            aria-pressed={m === minutesAgo}
            aria-label={m ? t.diaperSheet.minutesAgoA11y(m) : undefined}
            onClick={() => setMinutesAgo(m)}
          >
            {m ? t.diaperSheet.minutesAgo(m) : t.diaperSheet.now}
          </button>
        ))}
      </div>
      <div class="sheet-actions">
        {KINDS.map(({ kind, icon }) => (
          <button key={kind} type="button" class="big-btn big-btn--peach diaper-btn" onClick={() => props.onPick(kind, minutesAgo)}>
            <Icon name={icon} size={22} />
            {t.diaperSheet[kind]}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
