import type { BabyEvent } from '../data/events';
import { dayStats, type DayStats } from './stats';
import { addDays, startOfDay } from './time';

/** Local midnight of the Monday of the week containing `ts` (weeks start on Monday in Austria). */
export function startOfWeek(ts: number): number {
  const day = startOfDay(ts);
  const weekday = (new Date(day).getDay() + 6) % 7; // Monday 0 … Sunday 6
  return addDays(day, -weekday);
}

export interface WeekDay {
  start: number;
  /** Undefined for days after today: nothing to show yet. */
  stats: DayStats | undefined;
}

export interface WeekStats {
  start: number;
  end: number;
  days: WeekDay[];
  /** Days that have begun (today counts), for the averages. */
  elapsed: number;
  /** Sum and average per begun day for every counter. */
  total: DayStats;
  average: DayStats;
}

const KEYS = ['feeds', 'diapers', 'sleepMs', 'bottles', 'bottleMl', 'pumpMl'] as const;
const empty = (): DayStats => ({ feeds: 0, diapers: 0, sleepMs: 0, bottles: 0, bottleMl: 0, pumpMl: 0 });

/**
 * Counters for the seven days of the week starting at `weekStart`, from events overlapping it.
 * Each day is counted like Today (spec 6.2): sleep inside the day, a running sleep until `now`.
 */
export function weekStats(events: readonly BabyEvent[], weekStart: number, now: number): WeekStats {
  const days: WeekDay[] = [];
  const total = empty();
  let elapsed = 0;
  for (let i = 0; i < 7; i++) {
    const start = addDays(weekStart, i);
    if (start > now) {
      days.push({ start, stats: undefined });
      continue;
    }
    const stats = dayStats(events, start, addDays(weekStart, i + 1), now);
    for (const key of KEYS) total[key] += stats[key];
    elapsed++;
    days.push({ start, stats });
  }
  const average = empty();
  for (const key of KEYS) average[key] = elapsed ? total[key] / elapsed : 0;
  return { start: weekStart, end: addDays(weekStart, 7), days, elapsed, total, average };
}
