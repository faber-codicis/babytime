import { describe, expect, it } from 'vitest';
import type { BabyEvent } from '../../src/data/events';
import { formatWeekRange } from '../../src/logic/time';
import { startOfWeek, weekStats } from '../../src/logic/week';

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
let n = 0;
const ev = (e: Partial<BabyEvent> & Pick<BabyEvent, 'type' | 'start'>): BabyEvent => ({ id: String(++n), createdAt: e.start, updatedAt: e.start, ...e });

describe('startOfWeek', () => {
  it('is the Monday 00:00 of the week, also on Sunday and across the DST change', () => {
    expect(startOfWeek(at(21, 14))).toBe(at(19, 0)); // Wednesday → Monday 19 Oct
    expect(startOfWeek(at(25, 23))).toBe(at(19, 0)); // Sunday 25 Oct (DST ends) → same Monday
    expect(startOfWeek(at(26, 0))).toBe(at(26, 0)); // Monday itself
  });

  it('formats the week range', () => {
    expect(formatWeekRange(at(19, 0))).toBe('19.–25. Okt.');
    expect(formatWeekRange(at(26, 0))).toBe('26. Okt. – 1. Nov.');
  });
});

describe('weekStats', () => {
  const events = [
    ev({ type: 'feed', side: 'left', start: at(19, 8), end: at(19, 8, 20) }),
    ev({ type: 'feed', side: 'right', start: at(19, 8, 20), end: at(19, 8, 30) }), // same session
    ev({ type: 'feed', side: 'left', start: at(20, 9), end: at(20, 9, 15) }),
    ev({ type: 'diaper', diaper: 'wet', start: at(20, 10) }),
    ev({ type: 'sleep', start: at(20, 22), end: at(21, 2) }), // 2 h on Tue, 2 h on Wed
    ev({ type: 'bottle', amountMl: 90, milk: 'formula', start: at(21, 12) }),
  ];
  const week = weekStats(events, at(19, 0), at(21, 14, 20));

  it('counts each day like Today and leaves days after today empty', () => {
    expect(week.days.map((d) => d.stats?.feeds)).toEqual([1, 1, 0, undefined, undefined, undefined, undefined]);
    expect(week.days[1]!.stats!.sleepMs).toBe(2 * 3_600_000);
    expect(week.days[2]!.stats!.sleepMs).toBe(2 * 3_600_000);
    expect(week.days[2]!.stats!.bottleMl).toBe(90);
  });

  it('averages over the days that have begun', () => {
    expect(week.elapsed).toBe(3);
    expect(week.total.feeds).toBe(2);
    expect(week.average.feeds).toBeCloseTo(2 / 3);
    expect(week.average.sleepMs).toBeCloseTo((4 * 3_600_000) / 3);
  });

  it('a past week counts all seven days', () => {
    expect(weekStats([], at(12, 0), at(21, 14)).elapsed).toBe(7);
  });
});
