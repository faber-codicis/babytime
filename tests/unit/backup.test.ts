import { beforeEach, describe, expect, it } from 'vitest';
import { getLastSeenVersion, setLastSeenVersion } from '../../src/data/appState';
import {
  BackupError,
  buildExport,
  deleteAllData,
  exportFileName,
  importBackup,
  MAX_EVENTS,
  MAX_FILE_BYTES,
  parseBackup,
} from '../../src/data/backup';
import { db } from '../../src/data/db';
import { addDiaper, startFeed, toggleSleep } from '../../src/data/events';
import { setFlag } from '../../src/data/flags';
import { getProfile, saveProfile } from '../../src/data/profile';

const at = (h: number, m = 0) => new Date(2026, 9, 21, h, m).getTime();
const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const feed = (n: number, over: Record<string, unknown> = {}) => ({
  id: ID(n),
  type: 'feed',
  start: at(10),
  end: at(10, 20),
  side: 'left',
  createdAt: at(10),
  updatedAt: at(10, 20),
  ...over,
});
const file = (events: unknown[], over: Record<string, unknown> = {}) =>
  JSON.stringify({ app: 'babytime', schemaVersion: 1, exportedAt: at(12), profile: { babyName: 'Lena', onboarded: true }, events, ...over });

const refused = (text: string, size?: number) => {
  try {
    parseBackup(text, size);
  } catch (error) {
    expect(error).toBeInstanceOf(BackupError);
    return (error as Error).message;
  }
  throw new Error('expected the file to be refused');
};

beforeEach(async () => {
  await db.events.clear();
  await db.kv.clear();
});

describe('export', () => {
  it('contains app, schema version, profile and all events; file name has the local date', async () => {
    await saveProfile({ babyName: 'Lena', onboarded: true });
    await startFeed('left', at(9));
    await addDiaper('wet', at(9, 30));
    const backup = await buildExport(at(12));
    expect(backup).toMatchObject({ app: 'babytime', schemaVersion: 3, exportedAt: at(12), profile: { babyName: 'Lena', onboarded: true } });
    expect(backup.events).toHaveLength(2);
    expect(exportFileName(at(12))).toBe('babytime-2026-10-21.json');
  });

  it('round-trips: export, delete everything, import restores all entries', async () => {
    await saveProfile({ babyName: 'Lena', birthDate: '2026-10-09', onboarded: true });
    await startFeed('right', at(8));
    await toggleSleep(at(9));
    await addDiaper('both', at(9, 30));
    const before = await db.events.orderBy('start').toArray();
    const text = JSON.stringify(await buildExport());

    await deleteAllData();
    const parsed = parseBackup(text);
    expect(await importBackup(parsed, 'replace')).toBe(3);
    expect(await db.events.orderBy('start').toArray()).toEqual(before);
    expect(await getProfile()).toEqual({ babyName: 'Lena', birthDate: '2026-10-09', onboarded: true });
  });
});

describe('parseBackup refuses manipulated files', () => {
  it('too big, not JSON, not a backup, newer schema', () => {
    expect(refused(file([]), MAX_FILE_BYTES + 1)).toMatch(/zu groß/);
    expect(refused('{ kaputt')).toMatch(/nicht lesen/);
    expect(refused(JSON.stringify({ app: 'andere', schemaVersion: 1, events: [] }))).toMatch(/keine Baby-Time-Sicherung/);
    expect(refused(JSON.stringify([1, 2, 3]))).toMatch(/keine Baby-Time-Sicherung/);
    expect(refused(file([], { schemaVersion: 4 }))).toMatch(/neueren Version/);
    expect(refused(file([], { schemaVersion: '1' }))).toMatch(/keine Baby-Time-Sicherung/);
  });

  it('wrong types and values in an entry name the entry number', () => {
    const cases: Record<string, unknown>[] = [
      { id: 'not-a-uuid' },
      { type: 'bottle' },
      { start: '1729500000000' },
      { start: Number.NaN },
      { start: 1729500000 }, // seconds instead of ms
      { end: at(9) }, // before start
      { side: 'middle' },
      { side: undefined },
      { note: 'x'.repeat(501) },
      { note: 42 },
      { createdAt: undefined },
    ];
    for (const over of cases) {
      expect(refused(file([feed(1), feed(2, over)])), JSON.stringify(over)).toBe(
        'Eintrag 2 in der Datei ist fehlerhaft. Es wurde nichts geändert.',
      );
    }
    expect(refused(file([{ ...feed(1), type: 'diaper', diaper: 'wet' }]))).toMatch(/Eintrag 1/); // diaper with end and side
    expect(refused(file([null]))).toMatch(/Eintrag 1/);
  });

  it('duplicates, too many entries, two running feeds', () => {
    expect(refused(file([feed(1), feed(1)]))).toMatch(/doppelt/);
    expect(refused(file(new Array(MAX_EVENTS + 1).fill(0)))).toMatch(/zu viele/);
    expect(refused(file([feed(1, { end: undefined }), feed(2, { end: undefined })]))).toMatch(/laufendes Stillen/);
  });

  it('drops unknown fields and never lets __proto__ / constructor through', () => {
    const text = `{"app":"babytime","schemaVersion":1,"events":[{"id":"${ID(1)}","type":"diaper","diaper":"wet","start":${at(9)},"createdAt":${at(9)},"updatedAt":${at(9)},"__proto__":{"polluted":true},"constructor":{"x":1},"extra":"weg"}],"__proto__":{"polluted":true}}`;
    const parsed = parseBackup(text);
    expect(parsed.events[0]).toEqual({ id: ID(1), type: 'diaper', diaper: 'wet', start: at(9), createdAt: at(9), updatedAt: at(9) });
    expect(Object.getPrototypeOf(parsed.events[0])).toBe(Object.prototype);
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });

  it('invalid files change nothing in the database', async () => {
    await addDiaper('wet', at(8));
    expect(() => parseBackup(file([feed(1), feed(2, { type: 'x' })]))).toThrow(BackupError);
    expect(await db.events.count()).toBe(1);
  });
});

describe('importBackup', () => {
  it('merge adds new entries by id, newer edits win, profile stays', async () => {
    await saveProfile({ babyName: 'Hier', onboarded: true });
    await db.events.put(feed(1, { side: 'left', updatedAt: at(11) }) as never);
    const parsed = parseBackup(
      file([feed(1, { side: 'right', updatedAt: at(10, 30) }), feed(2, { start: at(11), end: at(11, 10), createdAt: at(11), updatedAt: at(11, 10) })]),
    );
    expect(await importBackup(parsed, 'merge')).toBe(1);
    expect((await db.events.get(ID(1)))?.side).toBe('left'); // local version is newer
    expect(await db.events.count()).toBe(2);
    expect((await getProfile()).babyName).toBe('Hier');
  });

  it('merge refuses a second running feed', async () => {
    await startFeed('left', at(12));
    const parsed = parseBackup(file([feed(1, { end: undefined })]));
    await expect(importBackup(parsed, 'merge')).rejects.toBeInstanceOf(BackupError);
    expect(await db.events.count()).toBe(1);
  });
});

describe('deleteAllData', () => {
  it('empties both tables: events, profile, lastSeenVersion and remembered hints', async () => {
    await addDiaper('wet', at(8));
    await saveProfile({ babyName: 'Lena', onboarded: true });
    await setLastSeenVersion('0.2.0');
    await setFlag('installHintDismissed');

    await deleteAllData();
    expect(await db.events.count()).toBe(0);
    expect(await db.kv.count()).toBe(0);
    expect(await getProfile()).toEqual({ onboarded: false });
    expect(await getLastSeenVersion()).toBeUndefined();
  });
});
