import type { BabyEvent } from '../data/events';

/** Short feeds and point events stay visible: at least this share of the day (≈ 7 min at 390 px). */
const MIN_WIDTH = 0.5;

export interface Mark {
  key: string;
  kind: 'sleep' | 'feed' | 'diaper' | 'bottle';
  left: number; // percent of the day
  width?: number; // percent, for spans
}

/** Positions of today's events on a 0–24 h scale; running spans end at `now`. */
export function timelineMarks(events: readonly BabyEvent[], dayStart: number, dayEnd: number, now: number): Mark[] {
  const span = dayEnd - dayStart;
  const pct = (ts: number) => (Math.min(Math.max(ts, dayStart), dayEnd) - dayStart) / span * 100;
  const marks: Mark[] = [];
  for (const e of events) {
    if (e.type === 'sleep' || e.type === 'feed') {
      const from = pct(e.start);
      const to = pct(e.end ?? now);
      if (to <= 0 || from >= 100 || (e.end ?? now) < dayStart) continue;
      marks.push({ key: e.id, kind: e.type, left: from, width: Math.max(MIN_WIDTH, to - from) });
    } else if (e.start >= dayStart && e.start < dayEnd) {
      marks.push({ key: e.id, kind: e.type === 'diaper' ? 'diaper' : 'bottle', left: pct(e.start) });
    }
  }
  // Sleep first, so feeds and dots are drawn on top.
  return marks.sort((a, b) => Number(b.kind === 'sleep') - Number(a.kind === 'sleep'));
}
