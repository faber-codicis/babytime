import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import {
  deleteMilestone,
  MILESTONE_NOTE_MAX,
  MILESTONE_TITLE_MAX,
  saveMilestone,
  validateMilestone,
  type Milestone,
  type MilestoneErrors,
  type MilestonePreset,
} from '../data/milestones';
import { isoDate } from '../logic/time';
import { t } from '../strings.de';
import { Sheet } from './Sheet';

/** What the sheet edits: a suggestion to mark, an own new one, or an existing entry. */
export type MilestoneTarget = { preset: MilestonePreset } | { custom: true } | { milestone: Milestone };

export const milestoneTitle = (m: { preset?: string | undefined; title?: string | undefined }) =>
  m.preset ? (t.milestones.presets as Record<string, string>)[m.preset] ?? m.preset : m.title ?? '';

interface Props {
  target: MilestoneTarget | undefined;
  onClose: () => void;
  onDone: (text: string, undo: () => Promise<void>) => void;
}

/** Date, optional note, and for own milestones a name (0.10.0). Delete asks first, like the history editor. */
export function MilestoneSheet({ target, onClose, onDone }: Props) {
  const existing = target && 'milestone' in target ? target.milestone : undefined;
  const preset = target && 'preset' in target ? target.preset : existing?.preset as MilestonePreset | undefined;
  const custom = !preset;
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<MilestoneErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);

  const key = existing?.id ?? (target && 'preset' in target ? target.preset : target ? 'custom' : undefined);
  useLayoutEffect(() => {
    setTitle(existing?.title ?? '');
    setDate(existing?.date ?? isoDate(Date.now()));
    setNote(existing?.note ?? '');
    setErrors({});
    setConfirmDelete(false);
  }, [key]);

  useEffect(() => {
    if (confirmDelete) keepRef.current?.focus();
  }, [confirmDelete]);

  const m = t.milestones;
  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const draft = { id: existing?.id, preset, title, date, note };
    const found = validateMilestone(draft, isoDate(Date.now()));
    setErrors(found);
    if (Object.keys(found).length) return;
    const { undo } = await saveMilestone(draft);
    onDone(m.saved, undo);
  };

  const onDelete = async () => {
    if (!existing) return;
    const undo = await deleteMilestone(existing.id);
    if (undo) onDone(m.deleted, undo);
    else onClose();
  };

  const invalid = (field: keyof MilestoneErrors) =>
    errors[field] ? { 'aria-invalid': true, 'aria-describedby': `milestone-${field}-error` } : {};
  const error = (field: keyof MilestoneErrors) =>
    errors[field] ? (
      <p id={`milestone-${field}-error`} class="field-error">
        {m.errors[errors[field]!]}
      </p>
    ) : null;

  return (
    <Sheet open={Boolean(target)} onClose={onClose} labelledBy="milestone-sheet-title">
      <form class="editor" noValidate onSubmit={(e) => void onSubmit(e)}>
        <h2 id="milestone-sheet-title" class="sheet-title">
          {preset ? milestoneTitle({ preset }) : existing ? m.sheetEdit : m.sheetAdd}
        </h2>

        {custom && (
          <div class="field">
            <label class="field-label" for="milestone-title">
              {m.name}
            </label>
            <input
              id="milestone-title"
              class="input"
              type="text"
              maxLength={MILESTONE_TITLE_MAX}
              value={title}
              onInput={(e) => setTitle(e.currentTarget.value)}
              {...invalid('title')}
            />
            {error('title')}
          </div>
        )}

        <div class="field">
          <label class="field-label" for="milestone-date">
            {m.date}
          </label>
          <input
            id="milestone-date"
            class="input"
            type="date"
            max={isoDate(Date.now())}
            value={date}
            onInput={(e) => setDate(e.currentTarget.value)}
            onChange={(e) => setDate(e.currentTarget.value)}
            {...invalid('date')}
          />
          {error('date')}
        </div>

        <div class="field">
          <label class="field-label" for="milestone-note">
            {m.note}
          </label>
          <textarea
            id="milestone-note"
            class="input textarea"
            rows={2}
            maxLength={MILESTONE_NOTE_MAX}
            value={note}
            onInput={(e) => setNote(e.currentTarget.value)}
            {...invalid('note')}
          />
          {error('note')}
        </div>

        {confirmDelete ? (
          <div class="confirm-box" role="group" aria-labelledby="milestone-delete-question">
            <p id="milestone-delete-question" class="sheet-text">
              {m.deleteConfirm}
            </p>
            <div class="sheet-actions sheet-actions--row">
              <button type="button" ref={keepRef} class="big-btn big-btn--white" onClick={() => setConfirmDelete(false)}>
                {m.deleteNo}
              </button>
              <button type="button" class="big-btn big-btn--warn-solid" onClick={() => void onDelete()}>
                {m.deleteYes}
              </button>
            </div>
          </div>
        ) : (
          <div class="sheet-actions">
            <button type="submit" class="big-btn big-btn--rose">
              {m.save}
            </button>
            {existing && (
              <button type="button" class="big-btn big-btn--white big-btn--warn" onClick={() => setConfirmDelete(true)}>
                {m.delete}
              </button>
            )}
          </div>
        )}
      </form>
    </Sheet>
  );
}
