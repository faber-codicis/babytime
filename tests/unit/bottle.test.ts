import { beforeEach, describe, expect, it } from 'vitest';
import { BackupError, buildExport, parseBackup } from '../../src/data/backup';
import { db, SCHEMA_VERSION } from '../../src/data/db';
import { addBottle, addPump, getEventsOverlapping, getLatestAmounts, saveEvent } from '../../src/data/events';
import { dayStats } from '../../src/logic/stats';
import { validateDraft, type EventDraft } from '../../src/logic/validate';

const at = (h: number, m = 0) => new Date(2026, 9, 21, h, m).getTime();
const NOW = at(14, 20);
const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

beforeEach(async () => {
  await db.events.clear();
});

describe('addBottle / addPump', () => {
  it('stores a point event with amount and kind, undo removes it', async () => {
    const bottle = await addBottle(90, 'formula', at(10));
    const pump = await addPump(120, 'both', at(11));
    expect(bottle.event).toMatchObject({ type: 'bottle', start: at(10), amountMl: 90, milk: 'formula' });
    expect(bottle.event.end).toBeUndefined();
    expect(pump.event).toMatchObject({ type: 'pump', amountMl: 120, pumpSide: 'both' });
    expect(await db.events.count()).toBe(2);
    await bottle.undo();
    expect(await db.events.count()).toBe(1);
  });

  it('refuses amounts that are not whole millilitres between 1 and 1000', async () => {
    for (const bad of [0, -5, 12.5, 1001, Number.NaN]) {
      await expect(addBottle(bad, 'breast')).rejects.toThrow(RangeError);
    }
    expect(await db.events.count()).toBe(0);
  });

  it('remembers the latest bottle and pump for the next sheet', async () => {
    await addBottle(60, 'breast', at(8));
    await addBottle(100, 'formula', at(12));
    await addPump(80, 'left', at(9));
    const latest = await getLatestAmounts();
    expect(latest.bottle?.amountMl).toBe(100);
    expect(latest.pump?.pumpSide).toBe('left');
  });

  it('counts as a point event for the day query (not as running)', async () => {
    await addBottle(60, 'breast', at(8));
    expect(await getEventsOverlapping(at(9), at(23))).toHaveLength(0);
    expect(await getEventsOverlapping(at(0), at(23))).toHaveLength(1);
  });
});

describe('dayStats with bottle and pump', () => {
  it('sums millilitres of today only', async () => {
    await addBottle(60, 'breast', at(8));
    await addBottle(90, 'formula', at(13));
    await addBottle(50, 'formula', at(8) - 24 * 3_600_000);
    await addPump(120, 'both', at(9));
    const events = await db.events.toArray();
    const stats = dayStats(events, at(0), at(0) + 24 * 3_600_000, NOW);
    expect(stats).toMatchObject({ bottles: 2, bottleMl: 150, pumpMl: 120, feeds: 0, diapers: 0 });
  });
});

describe('editing bottle and pump', () => {
  const draft = (over: Partial<EventDraft>): EventDraft => ({ type: 'bottle', start: at(12), end: undefined, amountMl: 90, milk: 'breast', note: '', ...over });

  it('validates the amount', () => {
    expect(validateDraft(draft({}), NOW)).toEqual({});
    expect(validateDraft(draft({ amountMl: undefined }), NOW).amount).toBeTruthy();
    expect(validateDraft(draft({ type: 'pump', amountMl: 2000 }), NOW).amount).toBeTruthy();
    // Other types do not need an amount.
    expect(validateDraft({ type: 'diaper', start: at(12), end: undefined, diaper: 'wet', note: '' }, NOW)).toEqual({});
  });

  it('backfills, drops fields of other types and never stores an end', async () => {
    const { event } = await saveEvent(draft({ end: at(12, 30), side: 'left', diaper: 'wet', pumpSide: 'left' }), NOW);
    const stored = await db.events.get(event.id);
    expect(stored).toMatchObject({ type: 'bottle', amountMl: 90, milk: 'breast' });
    expect(stored).not.toHaveProperty('end');
    expect(stored).not.toHaveProperty('side');
    expect(stored).not.toHaveProperty('diaper');
    expect(stored).not.toHaveProperty('pumpSide');

    const pump = await saveEvent(draft({ type: 'pump', milk: 'formula', pumpSide: undefined }), NOW);
    expect(pump.event).toMatchObject({ type: 'pump', pumpSide: 'both' });
    expect(pump.event).not.toHaveProperty('milk');
  });
});

describe('backup with bottle and pump', () => {
  const base = { start: at(10), createdAt: at(10), updatedAt: at(10) };
  const file = (events: unknown[], schemaVersion = SCHEMA_VERSION) =>
    JSON.stringify({ app: 'babytime', schemaVersion, exportedAt: at(12), events });

  it('exports with schema version 2 and parses the new types back', async () => {
    await addBottle(90, 'formula', at(10));
    await addPump(40, 'right', at(11));
    const exported = await buildExport(NOW);
    expect(exported.schemaVersion).toBe(2);
    const parsed = parseBackup(JSON.stringify(exported));
    expect(parsed.events.map((e) => [e.type, e.amountMl])).toEqual([
      ['bottle', 90],
      ['pump', 40],
    ]);
  });

  it('still reads version 1 files', () => {
    const v1 = file([{ id: ID(1), type: 'diaper', diaper: 'wet', ...base }], 1);
    expect(parseBackup(v1).events).toHaveLength(1);
  });

  it('refuses bad amounts, wrong kinds, an end and fields of other types', () => {
    const bad = [
      { id: ID(1), type: 'bottle', milk: 'breast', ...base },
      { id: ID(1), type: 'bottle', amountMl: 0, milk: 'breast', ...base },
      { id: ID(1), type: 'bottle', amountMl: 90.5, milk: 'breast', ...base },
      { id: ID(1), type: 'bottle', amountMl: '90', milk: 'breast', ...base },
      { id: ID(1), type: 'bottle', amountMl: 90, milk: 'cow', ...base },
      { id: ID(1), type: 'bottle', amountMl: 90, milk: 'breast', end: at(11), ...base },
      { id: ID(1), type: 'bottle', amountMl: 90, milk: 'breast', side: 'left', ...base },
      { id: ID(1), type: 'pump', amountMl: 90, pumpSide: 'middle', ...base },
      { id: ID(1), type: 'pump', amountMl: 90, pumpSide: 'both', milk: 'breast', ...base },
      { id: ID(1), type: 'diaper', diaper: 'wet', amountMl: 10, ...base },
    ];
    for (const entry of bad) {
      expect(() => parseBackup(file([entry])), JSON.stringify(entry)).toThrow(BackupError);
    }
  });
});
