import { beforeEach, describe, expect, it } from 'vitest';
import { getPartnerPassword, setPartnerPassword } from '../../src/data/appState';
import { BackupError, buildExport, deleteAllData, importBackup, mergeBackup, parseBackup } from '../../src/data/backup';
import { db } from '../../src/data/db';
import { addDiaper, cancelFeed, deleteEvent, startFeed } from '../../src/data/events';
import { deleteMilestone, saveMilestone } from '../../src/data/milestones';

/** Partner merge and deletion notes (0.19.0). */

const at = (h: number, m = 0) => new Date(2026, 10, 23, h, m).getTime();
const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const diaper = (n: number, updatedAt = at(10)) => ({ id: ID(n), type: 'diaper', diaper: 'wet', start: at(10), createdAt: at(10), updatedAt });
const file = (events: unknown[], deleted?: unknown[], milestones?: unknown[]) =>
  JSON.stringify({ app: 'babytime', schemaVersion: 4, exportedAt: at(12), profile: {}, events, ...(milestones && { milestones }), ...(deleted && { deleted }) });

beforeEach(async () => {
  await deleteAllData();
});

describe('deletion notes', () => {
  it('deleting an entry leaves a note with id and time only; undo removes it again', async () => {
    const { event } = await addDiaper('wet', at(9));
    const change = await deleteEvent(event.id);
    expect(await db.deleted.toArray()).toEqual([{ id: event.id, kind: 'event', at: expect.any(Number) }]);
    await change?.undo();
    expect(await db.events.get(event.id)).toEqual(event);
    expect(await db.deleted.count()).toBe(0);
  });

  it('undoing a new entry and discarding a running feed leave notes too', async () => {
    const { undo } = await addDiaper('wet', at(9));
    await undo();
    await startFeed('left', at(10));
    await cancelFeed();
    expect(await db.events.count()).toBe(0);
    expect(await db.deleted.count()).toBe(2);
  });

  it('deleting a milestone leaves a note; undo removes it', async () => {
    const { milestone } = await saveMilestone({ preset: 'smile', date: '2026-11-20', note: '' }, at(9));
    const undo = await deleteMilestone(milestone.id);
    expect((await db.deleted.get(milestone.id))?.kind).toBe('milestone');
    await undo?.();
    expect(await db.deleted.count()).toBe(0);
  });

  it('are exported, parsed back, and cleared by "Alle Daten löschen"', async () => {
    const { event } = await addDiaper('wet', at(9));
    await deleteEvent(event.id);
    const exported = await buildExport(at(12));
    expect(exported.schemaVersion).toBe(4);
    expect(parseBackup(JSON.stringify(exported)).deleted).toEqual([{ id: event.id, kind: 'event', at: expect.any(Number) }]);
    await deleteAllData();
    expect(await db.deleted.count()).toBe(0);
  });

  it('broken or doubled notes refuse the whole file', () => {
    for (const bad of [[{ id: 'x', kind: 'event', at: at(9) }], [{ id: ID(1), kind: 'photo', at: at(9) }], [{ id: ID(1), kind: 'event', at: 5 }]]) {
      expect(() => parseBackup(file([], bad))).toThrow(/Lösch-Vermerk 1/);
    }
    const twice = { id: ID(1), kind: 'event', at: at(9) };
    expect(() => parseBackup(file([], [twice, twice]))).toThrow(BackupError);
    expect(() => parseBackup(file([], {} as never))).toThrow(BackupError);
  });
});

describe('merge with the other phone', () => {
  it('removes what the other phone deleted and keeps the note', async () => {
    await db.events.put(diaper(1, at(10)) as never);
    const result = await mergeBackup(parseBackup(file([], [{ id: ID(1), kind: 'event', at: at(11) }])));
    expect(result).toEqual({ changed: 0, removed: 1 });
    expect(await db.events.count()).toBe(0);
    expect(await db.deleted.get(ID(1))).toBeDefined();
  });

  it('keeps an entry edited here after the deletion there', async () => {
    await db.events.put(diaper(1, at(12)) as never);
    const result = await mergeBackup(parseBackup(file([], [{ id: ID(1), kind: 'event', at: at(11) }])));
    expect(result.removed).toBe(0);
    expect(await db.events.count()).toBe(1);
  });

  it('does not bring back an entry deleted here', async () => {
    await db.deleted.put({ id: ID(1), kind: 'event', at: at(11) });
    const result = await mergeBackup(parseBackup(file([diaper(1, at(10)), diaper(2)])));
    expect(result).toEqual({ changed: 1, removed: 0 });
    expect(await db.events.get(ID(1))).toBeUndefined();
  });

  it('brings back an entry edited there after the deletion here, and drops the note', async () => {
    await db.deleted.put({ id: ID(1), kind: 'event', at: at(11) });
    await mergeBackup(parseBackup(file([diaper(1, at(12))])));
    expect(await db.events.get(ID(1))).toBeDefined();
    expect(await db.deleted.count()).toBe(0);
  });

  it('removes a milestone deleted there', async () => {
    const { milestone } = await saveMilestone({ preset: 'smile', date: '2026-11-20', note: '' }, at(9));
    const result = await mergeBackup(parseBackup(file([], [{ id: milestone.id, kind: 'milestone', at: at(10) }], [])));
    expect(result.removed).toBe(1);
    expect(await db.milestones.count()).toBe(0);
  });

  it('round trip: both phones end with the same entries', async () => {
    // Phone A: two diapers, then one deleted.
    const a1 = await addDiaper('wet', at(8));
    await addDiaper('dirty', at(9));
    await deleteEvent(a1.event.id);
    const fromA = JSON.stringify(await buildExport(at(12)));
    // Phone B had A's first diaper from an earlier merge and one of its own.
    await deleteAllData();
    await db.events.put(a1.event);
    await addDiaper('both', at(10));
    expect(await mergeBackup(parseBackup(fromA))).toEqual({ changed: 1, removed: 1 });
    expect((await db.events.toArray()).map((e) => e.diaper).sort()).toEqual(['both', 'dirty']);
  });

  it('replace takes the notes from the file', async () => {
    await db.deleted.put({ id: ID(5), kind: 'event', at: at(9) });
    await importBackup(parseBackup(file([], [{ id: ID(1), kind: 'event', at: at(11) }])), 'replace');
    expect((await db.deleted.toArray()).map((d) => d.id)).toEqual([ID(1)]);
  });
});

describe('partner password', () => {
  it('is stored on this phone and removed by "Alle Daten löschen"', async () => {
    expect(await getPartnerPassword()).toBeUndefined();
    await setPartnerPassword('gemeinsam123');
    expect(await getPartnerPassword()).toBe('gemeinsam123');
    await deleteAllData();
    expect(await getPartnerPassword()).toBeUndefined();
  });
});
