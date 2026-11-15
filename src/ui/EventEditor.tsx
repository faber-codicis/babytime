import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import {
  deleteEvent,
  saveEvent,
  ValidationError,
  type BabyEvent,
  type Change,
  type DiaperKind,
  type EventType,
  type MilkKind,
  type PumpSide,
  type Side,
} from '../data/events';
import { fromLocalInput, toLocalInput } from '../logic/time';
import { hasAmount, hasErrors, isTimed, NOTE_MAX, validateDraft, type DraftErrors, type EventDraft } from '../logic/validate';
import { t } from '../strings';
import { Sheet } from './Sheet';

export type EditorTarget = { mode: 'edit'; event: BabyEvent } | { mode: 'add' };

interface EditorProps {
  target: EditorTarget | undefined;
  onClose: () => void;
  onSaved: (change: Change) => void;
  onDeleted: (change: Change) => void;
}

interface FormState {
  type: EventType;
  start: string;
  end: string;
  side: Side;
  diaper: DiaperKind;
  /** Raw text of the amount field (bottle and pump). */
  amount: string;
  milk: MilkKind;
  pumpSide: PumpSide;
  note: string;
}

function initialForm(target: EditorTarget | undefined): FormState {
  const event = target?.mode === 'edit' ? target.event : undefined;
  return {
    type: event?.type ?? 'feed',
    start: toLocalInput(event?.start ?? Date.now()),
    end: event?.end !== undefined ? toLocalInput(event.end) : '',
    side: event?.side ?? 'left',
    diaper: event?.diaper ?? 'wet',
    amount: event?.amountMl !== undefined ? String(event.amountMl) : '',
    milk: event?.milk ?? 'breast',
    pumpSide: event?.pumpSide ?? 'both',
    note: event?.note ?? '',
  };
}

/** A row of toggle buttons (same look as the Links | Rechts switch). */
function Choice<T extends string>(props: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
  /** Five entry types do not fit one row on a phone: wrap into rows of three. */
  wrap?: boolean;
}) {
  return (
    <div class="field">
      <span class="field-label" id={`choice-${props.label}`}>
        {props.label}
      </span>
      <div class={`segmented segmented--small${props.wrap ? ' segmented--wrap' : ''}`} role="group" aria-labelledby={`choice-${props.label}`}>
        {props.options.map(([value, text]) => (
          <button
            key={value}
            type="button"
            class={`segment${value === props.value ? ' is-active' : ''}`}
            aria-pressed={value === props.value}
            onClick={() => props.onChange(value)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  return message ? (
    <p id={id} class="field-error">
      {message}
    </p>
  ) : null;
}

/** Edit sheet for one event, or backfill sheet with type choice (spec 6.6). */
export function EventEditor({ target, onClose, onSaved, onDeleted }: EditorProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(target));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const keepRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const askedOnce = useRef(false);

  const targetKey = target?.mode === 'edit' ? target.event.id : target?.mode;
  // Layout effect: the form is filled in the same frame the sheet opens, before any input can happen.
  useLayoutEffect(() => {
    setForm(initialForm(target));
    setErrors({});
    setConfirmDelete(false);
    askedOnce.current = false;
  }, [targetKey]);

  // Safe default focus on "Behalten"; back on "Löschen" when the question is withdrawn.
  useEffect(() => {
    if (confirmDelete) {
      askedOnce.current = true;
      keepRef.current?.focus();
    } else if (askedOnce.current) {
      deleteRef.current?.focus();
    }
  }, [confirmDelete]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const editing = target?.mode === 'edit' ? target.event : undefined;
  const timed = isTimed(form.type);

  const draft = (): EventDraft => {
    const end = fromLocalInput(form.end);
    return {
      id: editing?.id,
      type: form.type,
      start: fromLocalInput(form.start),
      end,
      endInvalid: form.end !== '' && end === undefined,
      side: form.side,
      diaper: form.diaper,
      amountMl: /^\d+$/.test(form.amount.trim()) ? Number(form.amount.trim()) : undefined,
      milk: form.milk,
      pumpSide: form.pumpSide,
      note: form.note,
    };
  };

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    if (busy) return;
    const d = draft();
    const found = validateDraft(d, Date.now());
    setErrors(found);
    if (hasErrors(found)) return;
    setBusy(true);
    try {
      onSaved(await saveEvent(d));
    } catch (error) {
      if (error instanceof ValidationError) setErrors(error.errors);
      else throw error;
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!editing || busy) return;
    setBusy(true);
    try {
      const change = await deleteEvent(editing.id);
      if (change) onDeleted(change);
      else onClose();
    } finally {
      setBusy(false);
    }
  };

  const invalid = (field: keyof DraftErrors) =>
    errors[field] ? { 'aria-invalid': true, 'aria-describedby': `editor-${field}-error` } : {};

  return (
    <Sheet open={Boolean(target)} onClose={onClose} labelledBy="editor-title">
      <form class="editor" onSubmit={(e) => void onSubmit(e)} noValidate>
        <h2 id="editor-title" class="sheet-title">
          {editing ? t.editor.titleEdit : t.editor.titleAdd}
        </h2>

        {!editing && (
          <Choice
            label={t.editor.type}
            value={form.type}
            options={[
              ['feed', t.editor.typeFeed],
              ['diaper', t.editor.typeDiaper],
              ['sleep', t.editor.typeSleep],
              ['bottle', t.editor.typeBottle],
              ['pump', t.editor.typePump],
            ]}
            wrap
            onChange={(type) => set('type', type)}
          />
        )}

        <div class="field">
          <label class="field-label" for="editor-start">
            {timed ? t.editor.start : t.editor.time}
          </label>
          <input
            id="editor-start"
            class="input"
            type="datetime-local"
            value={form.start}
            onInput={(e) => set('start', e.currentTarget.value)}
            onChange={(e) => set('start', e.currentTarget.value)}
            {...invalid('start')}
          />
          <FieldError id="editor-start-error" message={errors.start} />
        </div>

        {timed && (
          <div class="field">
            <label class="field-label" for="editor-end">
              {t.editor.end}
            </label>
            <input
              id="editor-end"
              class="input"
              type="datetime-local"
              value={form.end}
              onInput={(e) => set('end', e.currentTarget.value)}
              // Safari/iOS date pickers may only fire "change".
              onChange={(e) => set('end', e.currentTarget.value)}
              {...invalid('end')}
              aria-describedby={errors.end ? 'editor-end-error' : 'editor-end-hint'}
            />
            {errors.end ? (
              <FieldError id="editor-end-error" message={errors.end} />
            ) : (
              <p id="editor-end-hint" class="field-hint">
                {t.editor.endHint}
              </p>
            )}
          </div>
        )}

        {form.type === 'feed' && (
          <Choice
            label={t.editor.side}
            value={form.side}
            options={[
              ['left', t.feeding.left],
              ['right', t.feeding.right],
            ]}
            onChange={(side) => set('side', side)}
          />
        )}

        {form.type === 'diaper' && (
          <Choice
            label={t.editor.diaperKind}
            value={form.diaper}
            options={[
              ['wet', t.diaperSheet.wet],
              ['dirty', t.diaperSheet.dirty],
              ['both', t.diaperSheet.both],
            ]}
            onChange={(kind) => set('diaper', kind)}
          />
        )}

        {hasAmount(form.type) && (
          <div class="field">
            <label class="field-label" for="editor-amount">
              {t.editor.amount}
            </label>
            <input
              id="editor-amount"
              class="input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={form.amount}
              onInput={(e) => set('amount', e.currentTarget.value)}
              {...invalid('amount')}
            />
            <FieldError id="editor-amount-error" message={errors.amount} />
          </div>
        )}

        {form.type === 'bottle' && (
          <Choice
            label={t.editor.milk}
            value={form.milk}
            options={[
              ['breast', t.bottleSheet.breast],
              ['formula', t.bottleSheet.formula],
            ]}
            onChange={(milk) => set('milk', milk)}
          />
        )}

        {form.type === 'pump' && (
          <Choice
            label={t.editor.pumpSide}
            value={form.pumpSide}
            options={[
              ['left', t.bottleSheet.left],
              ['right', t.bottleSheet.right],
              ['both', t.bottleSheet.both],
            ]}
            onChange={(side) => set('pumpSide', side)}
          />
        )}

        <div class="field">
          <label class="field-label" for="editor-note">
            {t.editor.note}
          </label>
          <textarea
            id="editor-note"
            class="input textarea"
            rows={2}
            maxLength={NOTE_MAX}
            value={form.note}
            onInput={(e) => set('note', e.currentTarget.value)}
            {...invalid('note')}
          />
          <FieldError id="editor-note-error" message={errors.note} />
        </div>

        {confirmDelete ? (
          <div class="confirm-box" role="group" aria-labelledby="editor-delete-question">
            <p id="editor-delete-question" class="sheet-text">
              {t.editor.deleteConfirm}
            </p>
            <div class="sheet-actions sheet-actions--row">
              <button type="button" ref={keepRef} class="big-btn big-btn--white" onClick={() => setConfirmDelete(false)}>
                {t.editor.deleteNo}
              </button>
              <button type="button" class="big-btn big-btn--warn-solid" onClick={() => void onDelete()}>
                {t.editor.deleteYes}
              </button>
            </div>
          </div>
        ) : (
          <div class="sheet-actions">
            <button type="submit" class="big-btn big-btn--rose" disabled={busy}>
              {t.editor.save}
            </button>
            {editing && (
              <button
                type="button"
                ref={deleteRef}
                class="big-btn big-btn--white big-btn--warn"
                onClick={() => setConfirmDelete(true)}
              >
                {t.editor.delete}
              </button>
            )}
          </div>
        )}
      </form>
    </Sheet>
  );
}
