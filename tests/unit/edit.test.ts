import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/data/db';
import { deleteEvent, saveEvent, startFeed, toggleSleep, ValidationError } from '../../src/data/events';
import { fromLocalInput, toLocalInput } from '../../src/logic/time';
import { validateDraft, type EventDraft } from '../../src/logic/validate';

const MIN = 60_000;
const at = (h: number, m = 0) => new Date(2026, 9, 21, h, m).getTime();
const NOW = at(14, 20);

const draft = (over: Partial<EventDraft>): EventDraft => ({ type: 'feed', start: at(12), end: at(12, 20), side: 'left', note: '', ...over });

beforeEach(async () => {
  await db.events.clear();
});

describe('datetime-local conversion', () => {
  it('round-trips local times and rejects garbage', () => {
    expect(toLocalInput(at(7, 5))).toBe('2026-10-21T07:05');
    expect(fromLocalInput('2026-10-21T07:05')).toBe(at(7, 5));
    expect(fromLocalInput('')).toBeUndefined();
    expect(fromLocalInput('2026-02-30T10:00')).toBeUndefined();
    expect(fromLocalInput('morgen')).toBeUndefined();
  });
});

describe('validateDraft', () => {
  it('accepts a normal feed and a diaper without end', () => {
    expect(validateDraft(draft({}), NOW)).toEqual({});
    expect(validateDraft(draft({ type: 'diaper', end: undefined, diaper: 'wet' }), NOW)).toEqual({});
  });

  it('rejects end before start, missing start, future times and long notes', () => {
    expect(validateDraft(draft({ end: at(11) }), NOW).end).toBe('Das Ende darf nicht vor dem Beginn liegen.');
    expect(validateDraft(draft({ start: undefined }), NOW).start).toBe('Bitte einen Beginn angeben.');
    expect(validateDraft(draft({ start: NOW + 10 * MIN, end: undefined }), NOW).start).toBe('Der Beginn liegt in der Zukunft.');
    expect(validateDraft(draft({ end: NOW + 10 * MIN }), NOW).end).toBe('Das Ende liegt in der Zukunft.');
    expect(validateDraft(draft({ endInvalid: true }), NOW).end).toBeDefined();
    expect(validateDraft(draft({ note: 'x'.repeat(501) }), NOW).note).toBe('Höchstens 500 Zeichen.');
  });

  it('allows the current minute (minute precision of the input)', () => {
    expect(validateDraft(draft({ start: NOW + 30_000, end: undefined }), NOW)).toEqual({});
  });
});

describe('saveEvent', () => {
  it('backfills a finished feed and can be undone', async () => {
    const change = await saveEvent(draft({ note: '  ruhig  ' }), NOW);
    expect(change.event).toMatchObject({ type: 'feed', side: 'left', start: at(12), end: at(12, 20), note: 'ruhig' });
    await change.undo();
    expect(await db.events.count()).toBe(0);
  });

  it('edits an event and drops fields that do not belong to its type', async () => {
    const { event } = await saveEvent(draft({}), NOW);
    const edited = await saveEvent({ ...draft({ id: event.id, type: 'diaper', end: at(13), diaper: 'both' }) }, NOW);
    expect(edited.event).toEqual({
      id: event.id,
      type: 'diaper',
      start: at(12),
      diaper: 'both',
      createdAt: event.createdAt,
      updatedAt: NOW,
    });
    await edited.undo();
    expect(await db.events.get(event.id)).toEqual(event);
  });

  it('refuses a second running feed or sleep', async () => {
    await startFeed('left', at(14));
    await expect(saveEvent(draft({ end: undefined }), NOW)).rejects.toBeInstanceOf(ValidationError);

    await toggleSleep(at(13));
    await expect(saveEvent(draft({ type: 'sleep', end: undefined }), NOW)).rejects.toMatchObject({
      errors: { end: 'Es läuft bereits ein Schlaf. Bitte ein Ende angeben.' },
    });
  });

  it('may keep the running event itself running while editing it', async () => {
    const running = await startFeed('left', at(14));
    const { event } = await saveEvent(draft({ id: running.id, start: at(13, 55), end: undefined, side: 'right' }), NOW);
    expect(event).toMatchObject({ id: running.id, side: 'right', start: at(13, 55) });
    expect(event.end).toBeUndefined();
  });

  it('rejects invalid input without writing anything', async () => {
    await expect(saveEvent(draft({ end: at(11) }), NOW)).rejects.toBeInstanceOf(ValidationError);
    expect(await db.events.count()).toBe(0);
  });
});

describe('deleteEvent', () => {
  it('deletes and restores on undo', async () => {
    const { event } = await saveEvent(draft({}), NOW);
    const change = await deleteEvent(event.id);
    expect(await db.events.count()).toBe(0);
    await change?.undo();
    expect(await db.events.get(event.id)).toEqual(event);
  });
});
