import type { DiaperKind } from '../data/events';
import { t } from '../strings.de';
import { Icon } from './icons';
import { Sheet } from './Sheet';

const KINDS: DiaperKind[] = ['wet', 'dirty', 'both'];

/** Three big buttons; one tap saves with time "now" and closes (spec 6.4). */
export function DiaperSheet(props: { open: boolean; onClose: () => void; onPick: (kind: DiaperKind) => void }) {
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
      <div class="sheet-actions">
        {KINDS.map((kind) => (
          <button key={kind} type="button" class="big-btn big-btn--peach" onClick={() => props.onPick(kind)}>
            {t.diaperSheet[kind]}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
