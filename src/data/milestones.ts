import { db, type Milestone } from './db';
import type { Change } from './events';

export type { Milestone } from './db';

/**
 * Suggested milestones of the first year (0.10.0), roughly in the order they often come. Deliberately
 * without ages or "normal" ranges: every baby has its own pace, and the list is a diary, not a check.
 */
export const MILESTONE_PRESETS = [
  'smile',
  'laugh',
  'headUp',
  'grab',
  'rollTummy',
  'rollBack',
  'firstFood',
  'tooth',
  'sit',
  'crawl',
  'nightThrough',
  'stand',
  'firstWord',
  'steps',
] as const;
export type MilestonePreset = (typeof MILESTONE_PRESETS)[number];

export const MILESTONE_TITLE_MAX = 80;
export const MILESTONE_NOTE_MAX = 500;

export const isPreset = (value: unknown): value is MilestonePreset =>
  typeof value === 'string' && (MILESTONE_PRESETS as readonly string[]).includes(value);

/** Valid YYYY-MM-DD that is a real calendar date. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && y >= 2000 && y < 2200;
}

/** All milestones, newest date first (same date: last entered first). */
export async function getMilestones(): Promise<Milestone[]> {
  const all = await db.milestones.toArray();
  return all.sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
}

export interface MilestoneDraft {
  id?: string | undefined;
  preset?: MilestonePreset | undefined;
  title?: string | undefined;
  date: string;
  note: string;
}

export type MilestoneErrors = Partial<Record<'title' | 'date' | 'note', 'titleMissing' | 'titleTooLong' | 'dateMissing' | 'dateFuture' | 'noteTooLong'>>;

/** Field problems; empty = valid. `today` is the local date (YYYY-MM-DD). */
export function validateMilestone(draft: MilestoneDraft, today: string): MilestoneErrors {
  const errors: MilestoneErrors = {};
  if (!draft.preset) {
    const title = draft.title?.trim() ?? '';
    if (!title) errors.title = 'titleMissing';
    else if (title.length > MILESTONE_TITLE_MAX) errors.title = 'titleTooLong';
  }
  if (!isIsoDate(draft.date)) errors.date = 'dateMissing';
  else if (draft.date > today) errors.date = 'dateFuture';
  if (draft.note.trim().length > MILESTONE_NOTE_MAX) errors.note = 'noteTooLong';
  return errors;
}

/** Adds or updates a milestone (validated by the caller). A preset is reached only once: its old entry is updated. */
export async function saveMilestone(draft: MilestoneDraft, now = Date.now()): Promise<{ milestone: Milestone; undo: () => Promise<void> }> {
  return db.transaction('rw', db.milestones, async () => {
    const byId = draft.id ? await db.milestones.get(draft.id) : undefined;
    const byPreset = !byId && draft.preset ? await db.milestones.filter((m) => m.preset === draft.preset).first() : undefined;
    const previous = byId ?? byPreset;
    const milestone: Milestone = {
      id: previous?.id ?? crypto.randomUUID(),
      date: draft.date,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
    if (draft.preset) milestone.preset = draft.preset;
    else milestone.title = (draft.title ?? '').trim().slice(0, MILESTONE_TITLE_MAX);
    const note = draft.note.trim().slice(0, MILESTONE_NOTE_MAX);
    if (note) milestone.note = note;
    await db.milestones.put(milestone);
    const undo = previous
      ? async () => void (await db.milestones.put(previous))
      : async () => void (await db.milestones.delete(milestone.id));
    return { milestone, undo };
  });
}

export async function deleteMilestone(id: string): Promise<Change['undo'] | undefined> {
  const previous = await db.milestones.get(id);
  if (!previous) return undefined;
  await db.milestones.delete(id);
  return async () => void (await db.milestones.put(previous));
}
