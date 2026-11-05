import { beforeEach, describe, expect, it } from 'vitest';
import { BackupError, buildExport, deleteAllData, importBackup, parseBackup } from '../../src/data/backup';
import { db } from '../../src/data/db';
import { deleteMilestone, getMilestones, isIsoDate, saveMilestone, validateMilestone } from '../../src/data/milestones';
import { formatAgeOn, formatIsoDate } from '../../src/logic/time';

const NOW = new Date(2026, 10, 5, 14, 0).getTime();
const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

beforeEach(async () => {
  await db.milestones.clear();
  await db.events.clear();
});

describe('validateMilestone', () => {
  it('needs a name for own milestones, a real date, not in the future', () => {
    expect(validateMilestone({ preset: 'smile', date: '2026-11-01', note: '' }, '2026-11-05')).toEqual({});
    expect(validateMilestone({ title: '  ', date: '2026-11-01', note: '' }, '2026-11-05')).toEqual({ title: 'titleMissing' });
    expect(validateMilestone({ preset: 'smile', date: '2026-02-30', note: '' }, '2026-11-05')).toEqual({ date: 'dateMissing' });
    expect(validateMilestone({ preset: 'smile', date: '2026-11-06', note: '' }, '2026-11-05')).toEqual({ date: 'dateFuture' });
    expect(isIsoDate('2026-11-05')).toBe(true);
    expect(isIsoDate('5.11.2026')).toBe(false);
  });
});

describe('saveMilestone', () => {
  it('stores, sorts newest first, and undo restores', async () => {
    await saveMilestone({ preset: 'smile', date: '2026-10-20', note: 'beim Wickeln' }, NOW);
    const custom = await saveMilestone({ title: ' Erstes Bad ', date: '2026-10-25', note: '' }, NOW);
    const list = await getMilestones();
    expect(list.map((m) => m.preset ?? m.title)).toEqual(['Erstes Bad', 'smile']);
    expect(list[1]).toMatchObject({ note: 'beim Wickeln' });
    expect(list[0]).not.toHaveProperty('note');
    await custom.undo();
    expect(await db.milestones.count()).toBe(1);
  });

  it('a suggestion exists only once: marking it again updates the date', async () => {
    const first = await saveMilestone({ preset: 'tooth', date: '2026-10-20', note: '' }, NOW);
    const again = await saveMilestone({ preset: 'tooth', date: '2026-10-22', note: '' }, NOW + 1);
    expect(again.milestone.id).toBe(first.milestone.id);
    expect(await db.milestones.count()).toBe(1);
    await again.undo();
    expect((await db.milestones.get(first.milestone.id))?.date).toBe('2026-10-20');
  });

  it('delete with undo', async () => {
    const { milestone } = await saveMilestone({ preset: 'sit', date: '2026-10-20', note: '' }, NOW);
    const undo = await deleteMilestone(milestone.id);
    expect(await db.milestones.count()).toBe(0);
    await undo!();
    expect(await db.milestones.count()).toBe(1);
  });
});

describe('age on a date', () => {
  it('says "mit …" in the same steps as the header', () => {
    expect(formatAgeOn('2026-10-09', '2026-10-09')).toBe('am Tag der Geburt');
    expect(formatAgeOn('2026-10-09', '2026-10-14')).toBe('mit 5 Tagen');
    expect(formatAgeOn('2026-09-01', '2026-10-20')).toBe('mit 7 Wochen');
    expect(formatAgeOn('2026-01-15', '2026-10-20')).toBe('mit 9 Monaten');
    expect(formatAgeOn('2026-10-09', '2026-10-01')).toBeUndefined();
    expect(formatIsoDate('2026-11-05')).toBe('5. November 2026');
  });
});

describe('backup with milestones', () => {
  const base = { createdAt: NOW, updatedAt: NOW };
  const file = (milestones: unknown, extra: Record<string, unknown> = {}) =>
    JSON.stringify({ app: 'babytime', schemaVersion: 3, exportedAt: NOW, events: [], milestones, ...extra });

  it('exports schema 3 with milestones; replace restores them; files without milestones keep the ones here', async () => {
    await saveMilestone({ preset: 'smile', date: '2026-10-20', note: '' }, NOW);
    const exported = await buildExport(NOW);
    expect(exported.schemaVersion).toBe(3);
    expect(exported.milestones).toHaveLength(1);

    await deleteAllData();
    expect(await db.milestones.count()).toBe(0);
    await importBackup(parseBackup(JSON.stringify(exported)), 'replace');
    expect(await db.milestones.count()).toBe(1);

    const old = JSON.stringify({ app: 'babytime', schemaVersion: 2, exportedAt: NOW, events: [] });
    expect(parseBackup(old).milestones).toBeUndefined();
    await importBackup(parseBackup(old), 'replace');
    expect(await db.milestones.count()).toBe(1);
  });

  it('merge: newer edit wins, a suggestion stays single', async () => {
    const { milestone } = await saveMilestone({ preset: 'tooth', date: '2026-10-20', note: '' }, NOW);
    const newer = { id: ID(9), preset: 'tooth', date: '2026-10-18', createdAt: NOW, updatedAt: NOW + 10 };
    const own = { id: ID(8), title: 'Erstes Bad', date: '2026-10-10', ...base };
    await importBackup(parseBackup(file([newer, own])), 'merge');
    const list = await getMilestones();
    expect(list.map((m) => [m.id, m.date])).toEqual([
      [ID(9), '2026-10-18'],
      [ID(8), '2026-10-10'],
    ]);
    expect(await db.milestones.get(milestone.id)).toBeUndefined();

    const older = { id: ID(7), preset: 'tooth', date: '2026-10-01', createdAt: NOW, updatedAt: NOW };
    await importBackup(parseBackup(file([older])), 'merge');
    expect((await db.milestones.filter((m) => m.preset === 'tooth').toArray()).map((m) => m.id)).toEqual([ID(9)]);
  });

  it('refuses broken milestones and names the number', () => {
    const bad = [
      { id: 'x', preset: 'smile', date: '2026-10-20', ...base },
      { id: ID(1), preset: 'flies', date: '2026-10-20', ...base },
      { id: ID(1), preset: 'smile', title: 'too', date: '2026-10-20', ...base },
      { id: ID(1), title: '', date: '2026-10-20', ...base },
      { id: ID(1), title: 'x'.repeat(81), date: '2026-10-20', ...base },
      { id: ID(1), preset: 'smile', date: '20.10.2026', ...base },
      { id: ID(1), preset: 'smile', date: '2026-10-20', note: 5, ...base },
    ];
    for (const entry of bad) {
      expect(() => parseBackup(file([entry])), JSON.stringify(entry)).toThrow(/Meilenstein 1/);
    }
    expect(() => parseBackup(file('nope'))).toThrow(BackupError);
  });
});
