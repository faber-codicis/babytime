import { liveQuery } from 'dexie';
import { hasErrors, isTimed, NOTE_MAX, validateDraft, type DraftErrors, type EventDraft } from '../logic/validate';
import { t } from '../strings.de';
import { db, type BabyEvent, type DiaperKind, type EventType, type Side, type TimedEventType } from './db';

export type { BabyEvent, DiaperKind, EventType, Side, TimedEventType } from './db';

/** Result of a write that the UI can offer to undo (snackbar). */
export interface Change {
  event: BabyEvent;
  undo: () => Promise<void>;
}

export const otherSide = (side: Side): Side => (side === 'left' ? 'right' : 'left');

const newId = (): string => crypto.randomUUID();

/** An end time never lies before the start, even if the device clock jumped back. */
const clampEnd = (start: number, end: number): number => Math.max(start, end);

function createEvent(type: EventType, start: number, extra: Pick<BabyEvent, 'side' | 'diaper'> = {}): BabyEvent {
  return { id: newId(), type, start, ...extra, createdAt: start, updatedAt: start };
}

/** Undo for a newly created event: remove it again. */
const undoCreate = (id: string) => async () => {
  await db.events.delete(id);
};

/** Undo for an updated event: put the previous version back. */
const undoUpdate = (previous: BabyEvent) => async () => {
  await db.events.put(previous);
};

async function finish(event: BabyEvent, now: number): Promise<BabyEvent> {
  const finished: BabyEvent = { ...event, end: clampEnd(event.start, now), updatedAt: now };
  await db.events.put(finished);
  return finished;
}

// ---------------------------------------------------------------- live queries

/**
 * Runs `query` now and again whenever the data it read changes.
 * `query` may only use the read functions of src/data/. Returns an unsubscribe function.
 */
export function watch<T>(query: () => Promise<T>, onValue: (value: T) => void): () => void {
  const subscription = liveQuery(query).subscribe({
    next: onValue,
    error: (error: unknown) => console.error('Baby Time: query failed', error),
  });
  return () => subscription.unsubscribe();
}

// ---------------------------------------------------------------- queries

/** The running feed or sleep, if any. There is at most one per type. */
export async function getRunning(type: TimedEventType): Promise<BabyEvent | undefined> {
  return db.events
    .where('type')
    .equals(type)
    .filter((e) => e.end === undefined)
    .first();
}

/** Newest event of a type by start time, running or not. */
export async function getLatest(type: EventType): Promise<BabyEvent | undefined> {
  return db.events
    .orderBy('start')
    .reverse()
    .filter((e) => e.type === type)
    .first();
}

/** Newest finished event of a timed type by start time. */
export async function getLatestFinished(type: TimedEventType): Promise<BabyEvent | undefined> {
  return db.events
    .orderBy('start')
    .reverse()
    .filter((e) => e.type === type && e.end !== undefined)
    .first();
}

/** Newest finished event of a timed type that started before `before`. */
export async function getLatestFinishedBefore(type: TimedEventType, before: number): Promise<BabyEvent | undefined> {
  return db.events
    .where('start')
    .below(before)
    .reverse()
    .filter((e) => e.type === type && e.end !== undefined)
    .first();
}

/** Events starting in [from, to), oldest first. */
export async function getEventsBetween(from: number, to: number): Promise<BabyEvent[]> {
  return db.events.where('start').between(from, to, true, false).toArray();
}

/** Point in time an event stops counting: its end, its start for diapers, open-ended while running. */
const effectiveEnd = (e: BabyEvent): number => e.end ?? (e.type === 'diaper' ? e.start : Number.POSITIVE_INFINITY);

/** Events that overlap [from, to): started before `to` and not over before `from`. */
export async function getEventsOverlapping(from: number, to: number): Promise<BabyEvent[]> {
  return db.events
    .where('start')
    .below(to)
    .filter((e) => effectiveEnd(e) >= from)
    .toArray();
}

export async function getEvent(id: string): Promise<BabyEvent | undefined> {
  return db.events.get(id);
}

// ---------------------------------------------------------------- feed

/**
 * Starts a feed on `side`. If a feed is already running, it is returned unchanged,
 * so a double tap never creates two running feeds.
 */
export async function startFeed(side: Side, now = Date.now()): Promise<BabyEvent> {
  return db.transaction('rw', db.events, async () => {
    const running = await getRunning('feed');
    if (running) return running;
    const event = createEvent('feed', now, { side });
    await db.events.add(event);
    return event;
  });
}

/**
 * Switches the feed to side `to`: ends the running feed and immediately starts a new one
 * (one feed event has exactly one side). Already on `to`: nothing changes, so a double tap
 * never switches back. Without a running feed, simply starts on `to`.
 */
export async function switchFeedSide(to: Side, now = Date.now()): Promise<BabyEvent> {
  return db.transaction('rw', db.events, async () => {
    const running = await getRunning('feed');
    if (running?.side === to) return running;
    const start = running ? clampEnd(running.start, now) : now;
    if (running) await finish(running, start);
    const event = createEvent('feed', start, { side: to });
    await db.events.add(event);
    return event;
  });
}

/** Sets `end` on the running feed. Returns the finished event, or undefined if none was running. */
export async function finishFeed(now = Date.now()): Promise<BabyEvent | undefined> {
  return db.transaction('rw', db.events, async () => {
    const running = await getRunning('feed');
    return running ? finish(running, now) : undefined;
  });
}

/** Discards the running feed. Earlier, already finished sides stay saved. */
export async function cancelFeed(): Promise<void> {
  await db.transaction('rw', db.events, async () => {
    const running = await getRunning('feed');
    if (running) await db.events.delete(running.id);
  });
}

// ---------------------------------------------------------------- diaper

export async function addDiaper(kind: DiaperKind, now = Date.now()): Promise<Change> {
  const event = createEvent('diaper', now, { diaper: kind });
  await db.events.add(event);
  return { event, undo: undoCreate(event.id) };
}

// ---------------------------------------------------------------- sleep

/** Starts a sleep, or ends the running one. One tap, undoable. */
export async function toggleSleep(now = Date.now()): Promise<Change & { action: 'started' | 'ended' }> {
  return db.transaction('rw', db.events, async () => {
    const running = await getRunning('sleep');
    if (running) {
      const event = await finish(running, now);
      return { action: 'ended' as const, event, undo: undoUpdate(running) };
    }
    const event = createEvent('sleep', now);
    await db.events.add(event);
    return { action: 'started' as const, event, undo: undoCreate(event.id) };
  });
}

// ---------------------------------------------------------------- edit, backfill, delete (history)

/** Thrown by saveEvent with field errors for the edit sheet. */
export class ValidationError extends Error {
  constructor(readonly errors: DraftErrors) {
    super('invalid event');
  }
}

/**
 * Creates (no `draft.id`) or updates an event from the edit sheet.
 * The stored object is rebuilt from checked fields only; type-foreign fields are dropped.
 */
export async function saveEvent(draft: EventDraft, now = Date.now()): Promise<Change> {
  const errors = validateDraft(draft, now);
  if (hasErrors(errors)) throw new ValidationError(errors);
  const start = draft.start!;

  return db.transaction('rw', db.events, async () => {
    const previous = draft.id ? await db.events.get(draft.id) : undefined;
    if (draft.id && !previous) throw new Error('Baby Time: event to edit no longer exists');

    if (isTimed(draft.type) && draft.end === undefined) {
      const running = await getRunning(draft.type);
      if (running && running.id !== draft.id) {
        const what = draft.type === 'feed' ? t.editor.errors.runningFeed : t.editor.errors.runningSleep;
        throw new ValidationError({ end: t.editor.errors.alreadyRunning(what) });
      }
    }

    const event: BabyEvent = {
      id: previous?.id ?? newId(),
      type: draft.type,
      start,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
    if (isTimed(draft.type) && draft.end !== undefined) event.end = draft.end;
    if (draft.type === 'feed') event.side = draft.side ?? 'left';
    if (draft.type === 'diaper') event.diaper = draft.diaper ?? 'wet';
    const note = draft.note.trim().slice(0, NOTE_MAX);
    if (note) event.note = note;

    await db.events.put(event);
    return { event, undo: previous ? undoUpdate(previous) : undoCreate(event.id) };
  });
}

/** Deletes an event; undo puts it back unchanged. */
export async function deleteEvent(id: string): Promise<Change | undefined> {
  const previous = await db.events.get(id);
  if (!previous) return undefined;
  await db.events.delete(id);
  return { event: previous, undo: async () => void (await db.events.put(previous)) };
}

/** All events, newest first, starting at or after `from`. */
export async function getEventsSince(from: number): Promise<BabyEvent[]> {
  return db.events.where('start').aboveOrEqual(from).reverse().sortBy('start');
}

/** Start of the oldest event, if any (backup reminder: "no backup yet" counts from here). */
export async function getFirstEventStart(): Promise<number | undefined> {
  return (await db.events.orderBy('start').first())?.start;
}

/** Whether any event starts before `before` (for "show older"). */
export async function hasEventsBefore(before: number): Promise<boolean> {
  return (await db.events.where('start').below(before).count()) > 0;
}
