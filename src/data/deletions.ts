import { db, type BabyEvent, type Deletion, type Milestone } from './db';

/**
 * Deleting and restoring with a deletion note (0.19.0). The note keeps only id and time, so a merge with the
 * other phone ("Mit Partner abgleichen") removes the entry there too instead of bringing it back.
 * Callers inside a transaction must include `db.deleted` in its scope.
 */

export async function removeEvent(id: string, at = Date.now()): Promise<void> {
  await db.transaction('rw', db.events, db.deleted, async () => {
    await db.events.delete(id);
    await db.deleted.put({ id, kind: 'event', at });
  });
}

/** Puts an event back (undo) and drops its deletion note. */
export async function restoreEvent(event: BabyEvent): Promise<void> {
  await db.transaction('rw', db.events, db.deleted, async () => {
    await db.events.put(event);
    await db.deleted.delete(event.id);
  });
}

export async function removeMilestone(id: string, at = Date.now()): Promise<void> {
  await db.transaction('rw', db.milestones, db.deleted, async () => {
    await db.milestones.delete(id);
    await db.deleted.put({ id, kind: 'milestone', at });
  });
}

export async function restoreMilestone(milestone: Milestone): Promise<void> {
  await db.transaction('rw', db.milestones, db.deleted, async () => {
    await db.milestones.put(milestone);
    await db.deleted.delete(milestone.id);
  });
}

/** All deletion notes (for the backup file). */
export function getDeletions(): Promise<Deletion[]> {
  return db.deleted.toArray();
}
