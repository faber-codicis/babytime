import { hasAmount, isAmount, isTimed, NOTE_MAX } from '../logic/validate';
import { t } from '../strings';
import { db, SCHEMA_VERSION, type Milestone, type BabyEvent, type DiaperKind, type EventType, type MilkKind, type PumpSide, type Side } from './db';
import { isIsoDate, isPreset, MILESTONE_NOTE_MAX, MILESTONE_TITLE_MAX } from './milestones';
import { sanitizeProfile, type Profile } from './profile';
import { resetTheme } from './theme';

/** Spec 13.5 limits. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_EVENTS = 100_000;
export const MAX_MILESTONES = 1_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES: readonly EventType[] = ['feed', 'diaper', 'sleep', 'bottle', 'pump'];
const SIDES: readonly Side[] = ['left', 'right'];
const DIAPERS: readonly DiaperKind[] = ['wet', 'dirty', 'both'];
const MILKS: readonly MilkKind[] = ['breast', 'formula'];
const PUMP_SIDES: readonly PumpSide[] = ['left', 'right', 'both'];
/** Plausible time range for entries: from 2000 until far ahead (catches seconds-vs-ms mistakes). */
const MIN_TIME = Date.UTC(2000, 0, 1);
const MAX_TIME = Date.UTC(2200, 0, 1);

export interface BackupFile {
  app: 'babytime';
  schemaVersion: number;
  exportedAt: number;
  profile: Profile;
  events: BabyEvent[];
  /** Since schema version 3 (0.10.0). */
  milestones: Milestone[];
}

/** A checked backup, ready to import. */
export interface ParsedBackup {
  exportedAt: number | undefined;
  profile: Profile | undefined;
  events: BabyEvent[];
  /** Undefined for files without milestones (older than 0.10.0): then the milestones on the phone stay. */
  milestones: Milestone[] | undefined;
}

/** Import refused; `message` is shown to the user as is. Nothing has been changed. */
export class BackupError extends Error {}

// ---------------------------------------------------------------- export

export async function buildExport(now = Date.now()): Promise<BackupFile> {
  return db.transaction('r', db.events, db.kv, db.milestones, async () => {
    const [events, profileEntry, milestones] = await Promise.all([
      db.events.orderBy('start').toArray(),
      db.kv.get('profile'),
      db.milestones.orderBy('date').toArray(),
    ]);
    return {
      app: 'babytime',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: now,
      profile: sanitizeProfile(profileEntry?.value),
      events,
      milestones,
    };
  });
}

/** "babytime-2026-10-21.json" (local date). */
export function exportFileName(now = Date.now()): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `babytime-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

// ---------------------------------------------------------------- import: validation

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= MIN_TIME && value <= MAX_TIME;

const own = (record: Record<string, unknown>, key: string): unknown =>
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

/**
 * Checks one entry field by field and builds a fresh object from the checked values only
 * (never spread from parsed JSON, so `__proto__`/`constructor` keys cannot leak in). Undefined = invalid.
 */
export function rebuildEvent(raw: unknown): BabyEvent | undefined {
  if (!isRecord(raw)) return undefined;
  const id = own(raw, 'id');
  const type = own(raw, 'type');
  const start = own(raw, 'start');
  const end = own(raw, 'end');
  const side = own(raw, 'side');
  const diaper = own(raw, 'diaper');
  const amountMl = own(raw, 'amountMl');
  const milk = own(raw, 'milk');
  const pumpSide = own(raw, 'pumpSide');
  const note = own(raw, 'note');
  const createdAt = own(raw, 'createdAt');
  const updatedAt = own(raw, 'updatedAt');

  if (typeof id !== 'string' || !UUID.test(id)) return undefined;
  if (typeof type !== 'string' || !TYPES.includes(type as EventType)) return undefined;
  if (!isTime(start) || !isTime(createdAt) || !isTime(updatedAt)) return undefined;

  const event: BabyEvent = { id: id.toLowerCase(), type: type as EventType, start, createdAt, updatedAt };

  if (end !== undefined) {
    if (!isTimed(type as EventType) || !isTime(end) || end < start) return undefined;
    event.end = end;
  }
  if (type === 'feed') {
    if (typeof side !== 'string' || !SIDES.includes(side as Side)) return undefined;
    event.side = side as Side;
  } else if (side !== undefined) return undefined;
  if (type === 'diaper') {
    if (typeof diaper !== 'string' || !DIAPERS.includes(diaper as DiaperKind)) return undefined;
    event.diaper = diaper as DiaperKind;
  } else if (diaper !== undefined) return undefined;
  if (hasAmount(type as EventType)) {
    if (!isAmount(amountMl)) return undefined;
    event.amountMl = amountMl;
  } else if (amountMl !== undefined) return undefined;
  if (type === 'bottle') {
    if (typeof milk !== 'string' || !MILKS.includes(milk as MilkKind)) return undefined;
    event.milk = milk as MilkKind;
  } else if (milk !== undefined) return undefined;
  if (type === 'pump') {
    if (typeof pumpSide !== 'string' || !PUMP_SIDES.includes(pumpSide as PumpSide)) return undefined;
    event.pumpSide = pumpSide as PumpSide;
  } else if (pumpSide !== undefined) return undefined;
  if (note !== undefined) {
    if (typeof note !== 'string' || note.length > NOTE_MAX) return undefined;
    if (note.trim()) event.note = note.trim();
  }
  return event;
}

/** Same rules as rebuildEvent, for one milestone. Undefined = invalid. */
export function rebuildMilestone(raw: unknown): Milestone | undefined {
  if (!isRecord(raw)) return undefined;
  const id = own(raw, 'id');
  const preset = own(raw, 'preset');
  const title = own(raw, 'title');
  const date = own(raw, 'date');
  const note = own(raw, 'note');
  const createdAt = own(raw, 'createdAt');
  const updatedAt = own(raw, 'updatedAt');

  if (typeof id !== 'string' || !UUID.test(id)) return undefined;
  if (!isIsoDate(date) || !isTime(createdAt) || !isTime(updatedAt)) return undefined;
  const milestone: Milestone = { id: id.toLowerCase(), date, createdAt, updatedAt };
  if (preset !== undefined) {
    if (!isPreset(preset) || title !== undefined) return undefined;
    milestone.preset = preset;
  } else {
    if (typeof title !== 'string' || !title.trim() || title.length > MILESTONE_TITLE_MAX) return undefined;
    milestone.title = title.trim();
  }
  if (note !== undefined) {
    if (typeof note !== 'string' || note.length > MILESTONE_NOTE_MAX) return undefined;
    if (note.trim()) milestone.note = note.trim();
  }
  return milestone;
}

/** Parses and fully checks a backup file. Throws BackupError with a user-facing message. */
export function parseBackup(text: string, byteSize = new Blob([text]).size): ParsedBackup {
  const e = t.restore.errors;
  if (byteSize > MAX_FILE_BYTES) throw new BackupError(e.tooBig);

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError(e.notJson);
  }
  if (!isRecord(data) || own(data, 'app') !== 'babytime' || !Array.isArray(own(data, 'events'))) {
    throw new BackupError(e.notBackup);
  }
  const schemaVersion = own(data, 'schemaVersion');
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion < 1) throw new BackupError(e.notBackup);
  if (schemaVersion > SCHEMA_VERSION) throw new BackupError(e.newerSchema);

  const rawEvents = own(data, 'events') as unknown[];
  if (rawEvents.length > MAX_EVENTS) throw new BackupError(e.tooMany);

  const events: BabyEvent[] = [];
  const ids = new Set<string>();
  const running = { feed: 0, sleep: 0 };
  for (const [index, raw] of rawEvents.entries()) {
    const event = rebuildEvent(raw);
    if (!event) throw new BackupError(e.invalidEntry(index + 1));
    if (ids.has(event.id)) throw new BackupError(e.duplicate(index + 1));
    ids.add(event.id);
    if (isTimed(event.type) && event.end === undefined) running[event.type]++;
    events.push(event);
  }
  if (running.feed > 1 || running.sleep > 1) throw new BackupError(e.running);

  const rawMilestones = own(data, 'milestones');
  let milestones: Milestone[] | undefined;
  if (rawMilestones !== undefined) {
    if (!Array.isArray(rawMilestones)) throw new BackupError(e.notBackup);
    if (rawMilestones.length > MAX_MILESTONES) throw new BackupError(e.tooMany);
    milestones = [];
    const milestoneIds = new Set<string>();
    for (const [index, raw] of rawMilestones.entries()) {
      const milestone = rebuildMilestone(raw);
      if (!milestone) throw new BackupError(e.invalidMilestone(index + 1));
      if (milestoneIds.has(milestone.id)) throw new BackupError(e.invalidMilestone(index + 1));
      milestoneIds.add(milestone.id);
      milestones.push(milestone);
    }
  }

  const exportedAt = own(data, 'exportedAt');
  const profile = own(data, 'profile');
  return {
    milestones,
    exportedAt: typeof exportedAt === 'number' && Number.isFinite(exportedAt) ? exportedAt : undefined,
    profile: isRecord(profile) ? { ...sanitizeProfile(profile), onboarded: true } : undefined,
    events,
  };
}

// ---------------------------------------------------------------- import: writing

export type ImportMode = 'replace' | 'merge';

/**
 * Writes a checked backup in one transaction (all or nothing).
 * replace: events (and profile and milestones, if the file has them) are replaced.
 * merge: entries are added by id; for the same id the more recently edited version wins; the profile stays.
 * Milestones merge the same way; a suggested milestone exists once, the more recently edited one wins.
 */
export async function importBackup(backup: ParsedBackup, mode: ImportMode): Promise<number> {
  return db.transaction('rw', db.events, db.kv, db.milestones, async () => {
    if (mode === 'replace') {
      await db.events.clear();
      await db.events.bulkPut(backup.events);
      if (backup.profile) await db.kv.put({ key: 'profile', value: backup.profile });
      if (backup.milestones) {
        await db.milestones.clear();
        await db.milestones.bulkPut(backup.milestones);
      }
      return backup.events.length;
    }

    for (const milestone of backup.milestones ?? []) await mergeMilestone(milestone);

    const existing = await db.events.bulkGet(backup.events.map((e) => e.id));
    const incoming = backup.events.filter((event, i) => {
      const current = existing[i];
      return !current || event.updatedAt > current.updatedAt;
    });

    // Still at most one running feed and one running sleep afterwards.
    for (const type of ['feed', 'sleep'] as const) {
      const fileRunning = incoming.find((e) => e.type === type && e.end === undefined);
      if (!fileRunning) continue;
      const hereRunning = await db.events
        .where('type')
        .equals(type)
        .filter((e) => e.end === undefined && e.id !== fileRunning.id)
        .first();
      if (hereRunning) throw new BackupError(t.restore.errors.runningConflict);
    }

    await db.events.bulkPut(incoming);
    return incoming.length;
  });
}

async function mergeMilestone(incoming: Milestone): Promise<void> {
  const same = await db.milestones.get(incoming.id);
  const twin = incoming.preset ? await db.milestones.filter((m) => m.preset === incoming.preset && m.id !== incoming.id).first() : undefined;
  const current = [same, twin].filter((m): m is Milestone => Boolean(m));
  if (current.some((m) => m.updatedAt >= incoming.updatedAt)) return;
  if (twin) await db.milestones.delete(twin.id);
  await db.milestones.put(incoming);
}

// ---------------------------------------------------------------- delete everything

/**
 * Removes all entries, milestones and every kv value (profile, lastSeenVersion, remembered hints) and resets the
 * design to light, like a fresh install. Service worker and caches stay, so the app keeps working offline (spec 6.8).
 */
export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', db.events, db.kv, db.milestones, async () => {
    await db.events.clear();
    await db.kv.clear();
    await db.milestones.clear();
  });
  resetTheme();
}
