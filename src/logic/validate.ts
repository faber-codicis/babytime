import type { DiaperKind, EventType, MilkKind, PointEventType, PumpSide, Side, TimedEventType } from '../data/events';
import { t } from '../strings.de';
import { MINUTE } from './time';

export const NOTE_MAX = 500;

/** Bottle and pump amounts in whole millilitres (since 0.6.0). More than a litre at once is a typo. */
export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 1000;

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
  /** Bottle and pump: parsed amount (undefined = empty or not a number). */
  amountMl?: number | undefined;
  milk?: MilkKind | undefined;
  pumpSide?: PumpSide | undefined;
  note: string;
}

export type DraftField = 'start' | 'end' | 'amount' | 'note';
export type DraftErrors = Partial<Record<DraftField, string>>;

export const isTimed = (type: EventType): type is TimedEventType => type === 'feed' || type === 'sleep';
export const isPoint = (type: EventType): type is PointEventType => !isTimed(type);
export const hasAmount = (type: EventType): type is 'bottle' | 'pump' => type === 'bottle' || type === 'pump';

/** A valid amount: whole millilitres within AMOUNT_MIN..AMOUNT_MAX. */
export const isAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= AMOUNT_MIN && value <= AMOUNT_MAX;

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

  if (hasAmount(draft.type) && !isAmount(draft.amountMl)) errors.amount = e.amount(AMOUNT_MIN, AMOUNT_MAX);

  if (draft.note.trim().length > NOTE_MAX) errors.note = e.noteTooLong(NOTE_MAX);
  return errors;
}

export const hasErrors = (errors: DraftErrors) => Object.keys(errors).length > 0;
