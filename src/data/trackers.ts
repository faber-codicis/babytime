import { db } from './db';

/**
 * "Was möchtest du festhalten?" (0.8.0, mockup "Einstellungen"): which trackers appear on Today,
 * plus whether Today shows the day timeline. Everything is on by default. Switching a tracker off
 * only hides it – its entries stay in the history and in backups.
 */
export interface Trackers {
  feed: boolean;
  bottle: boolean;
  pump: boolean;
  diaper: boolean;
  sleep: boolean;
  timeline: boolean;
}

export type TrackerKey = keyof Trackers;
export const TRACKER_KINDS = ['feed', 'bottle', 'pump', 'diaper', 'sleep'] as const;

const KEY = 'trackers';
export const DEFAULT_TRACKERS: Trackers = { feed: true, bottle: true, pump: true, diaper: true, sleep: true, timeline: true };

/** Clean settings from untrusted input: only known keys, only booleans; missing means on. */
export function sanitizeTrackers(input: unknown): Trackers {
  const source = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_TRACKERS };
  for (const key of Object.keys(DEFAULT_TRACKERS) as TrackerKey[]) {
    if (typeof source[key] === 'boolean') out[key] = source[key];
  }
  // At least one tracker stays on, otherwise Today would be empty.
  if (!TRACKER_KINDS.some((k) => out[k])) out.feed = true;
  return out;
}

export async function getTrackers(): Promise<Trackers> {
  return sanitizeTrackers((await db.kv.get(KEY))?.value);
}

export async function setTracker(key: TrackerKey, on: boolean): Promise<Trackers> {
  return db.transaction('rw', db.kv, async () => {
    const next = sanitizeTrackers({ ...(await getTrackers()), [key]: on });
    await db.kv.put({ key: KEY, value: next });
    return next;
  });
}

/** Whether switching `key` off would leave no tracker on (the switch then stays on). */
export function isLastTracker(trackers: Trackers, key: TrackerKey): boolean {
  return key !== 'timeline' && TRACKER_KINDS.filter((k) => trackers[k]).length === 1 && trackers[key];
}
