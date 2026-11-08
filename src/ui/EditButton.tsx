import type { BabyEvent } from '../data/events';
import { Icon } from './icons';

/** Small pencil in the corner of a Today card (0.12.0): opens the entry in the editor, without the detour via Verlauf. */
export function EditButton({ label, event, onEdit }: { label: string; event: BabyEvent; onEdit: (event: BabyEvent) => void }) {
  return (
    <button type="button" class="card-edit" aria-label={label} onClick={() => onEdit(event)}>
      <span class="card-edit-circle">
        <Icon name="pencil" size={16} />
      </span>
    </button>
  );
}
