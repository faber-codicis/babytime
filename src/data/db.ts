import Dexie, { type EntityTable } from 'dexie';

export type EventType = 'feed' | 'diaper' | 'sleep' | 'bottle' | 'pump';
export type TimedEventType = 'feed' | 'sleep';
/** Point in time, no duration: diaper, bottle, pump. */
export type PointEventType = Exclude<EventType, TimedEventType>;
export type Side = 'left' | 'right';
export type DiaperKind = 'wet' | 'dirty' | 'both';
/** What was in the bottle (since 0.6.0). */
export type MilkKind = 'breast' | 'formula';
/** Which breast was pumped (since 0.6.0). */
export type PumpSide = 'left' | 'right' | 'both';

export interface BabyEvent {
  id: string; // crypto.randomUUID()
  type: EventType;
  start: number; // epoch ms
  end?: number; // epoch ms; missing = still running (feed and sleep only)
  side?: Side; // feed only
  diaper?: DiaperKind; // diaper only
  amountMl?: number; // bottle and pump only: whole millilitres
  milk?: MilkKind; // bottle only
  pumpSide?: PumpSide; // pump only
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/** A milestone the baby reached (0.10.0). Presets carry `preset`, own ones only `title`. */
export interface Milestone {
  id: string; // crypto.randomUUID()
  /** Key of a suggested milestone (MILESTONE_PRESETS); missing for one the parent named. */
  preset?: string;
  /** Own milestones only. */
  title?: string;
  date: string; // YYYY-MM-DD, local
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Note that an entry or milestone was deleted (0.19.0), so a merge from the other phone does not bring it back.
 * Only the id and the time are kept, never the content.
 */
export interface Deletion {
  id: string;
  kind: 'event' | 'milestone';
  at: number; // epoch ms
}

export interface KvEntry {
  key: string;
  value: unknown;
}

/**
 * Version of the backup file format (spec 13.5). 2 since 0.6.0: entries may be bottle or pump.
 * 3 since 0.10.0: the file may contain `milestones`. 4 since 0.19.0: the file may contain `deleted`.
 * Older apps refuse such files with the "newer version" message instead of "entry n is broken".
 * Dexie: version 1 until 0.9.0, version 2 adds the `milestones` table (0.10.0), version 3 the `deleted` table (0.19.0).
 */
export const SCHEMA_VERSION = 4;

export class BabyTimeDb extends Dexie {
  events!: EntityTable<BabyEvent, 'id'>;
  kv!: EntityTable<KvEntry, 'key'>;
  milestones!: EntityTable<Milestone, 'id'>;
  deleted!: EntityTable<Deletion, 'id'>;

  constructor(name = 'babytime') {
    super(name);
    this.version(1).stores({
      events: 'id, type, start',
      kv: 'key',
    });
    // 0.10.0: milestones in their own table; events and kv stay as they are, so no upgrade function.
    this.version(2).stores({ milestones: 'id, date' });
    // 0.19.0: deletion notes for the partner merge; nothing to migrate.
    this.version(3).stores({ deleted: 'id' });
    // Migrations: add new versions below and never edit the ones above, e.g.
    // this.version(3).stores({ ... }).upgrade((tx) => tx.table('events').toCollection().modify(...));
    // Data may only be reset when the schema itself cannot be migrated (spec 2a).
  }
}

/** The single database instance. Only modules in src/data/ may import it. */
export const db = new BabyTimeDb();

let persistRequested = false;

/** Opens the database and asks once per start for persistent storage (result ignored). */
export async function openDb(): Promise<void> {
  await db.open();
  if (!persistRequested && typeof navigator !== 'undefined' && navigator.storage?.persist) {
    persistRequested = true;
    navigator.storage.persist().catch(() => undefined);
  }
}
