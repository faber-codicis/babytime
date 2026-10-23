import type { DiaperKind, EventType, Side } from '../data/events';
import { t } from '../strings.de';
import { MINUTE } from './time';

export const NOTE_MAX = 500;

/** Times may lie this far ahead, because datetime-local inputs only have minute precision. */
const FUTURE_TOLERANCE = MINUTE;

/** What the edit sheet produces; times already parsed (undefined = empty or invalid input). */
export interface EventDraft {
  id?: string | undefined;
  type: EventType;
  start: number | undefined;
  end: number | undefined;
  /** True if the end field contains text that is not a valid time. */
  endInvalid?: boolean;
  side?: Side | undefined;
  diaper?: DiaperKind | undefined;
  note: string;
}

export type DraftField = 'start' | 'end' | 'note';
export type DraftErrors = Partial<Record<DraftField, string>>;

export const isTimed = (type: EventType): type is 'feed' | 'sleep' => type !== 'diaper';

/** Field errors for a draft; empty object means valid. The "already running" rule needs the database (repository). */
export function validateDraft(draft: EventDraft, now: number): DraftErrors {
  const e = t.editor.errors;
  const errors: DraftErrors = {};
  const latest = now + FUTURE_TOLERANCE;

  if (draft.start === undefined || !Number.isFinite(draft.start)) errors.start = e.startMissing;
  else if (draft.start > latest) errors.start = e.startFuture;

  if (isTimed(draft.type)) {
    if (draft.endInvalid) errors.end = e.endMissing;
    else if (draft.end !== undefined) {
      if (!Number.isFinite(draft.end)) errors.end = e.endMissing;
      else if (draft.start !== undefined && draft.end < draft.start) errors.end = e.endBeforeStart;
      else if (draft.end > latest) errors.end = e.endFuture;
    }
  }

  if (draft.note.trim().length > NOTE_MAX) errors.note = e.noteTooLong(NOTE_MAX);
  return errors;
}

export const hasErrors = (errors: DraftErrors) => Object.keys(errors).length > 0;
