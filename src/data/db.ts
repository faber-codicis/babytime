import Dexie, { type EntityTable } from 'dexie';

export type EventType = 'feed' | 'diaper' | 'sleep';
export type TimedEventType = 'feed' | 'sleep';
export type Side = 'left' | 'right';
export type DiaperKind = 'wet' | 'dirty' | 'both';

export interface BabyEvent {
  id: string; // crypto.randomUUID()
  type: EventType;
  start: number; // epoch ms
  end?: number; // epoch ms; missing = still running (feed and sleep only)
  side?: Side; // feed only
  diaper?: DiaperKind; // diaper only
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KvEntry {
  key: string;
  value: unknown;
}

export const SCHEMA_VERSION = 1;

export class BabyTimeDb extends Dexie {
  events!: EntityTable<BabyEvent, 'id'>;
  kv!: EntityTable<KvEntry, 'key'>;

  constructor(name = 'babytime') {
    super(name);
    this.version(1).stores({
      events: 'id, type, start',
      kv: 'key',
    });
    // Migrations: add new versions below and never edit the ones above, e.g.
    // this.version(2).stores({ ... }).upgrade((tx) => tx.table('events').toCollection().modify(...));
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
