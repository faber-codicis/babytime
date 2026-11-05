import { describe, expect, it } from 'vitest';
import type { BabyEvent } from '../../src/data/events';
import { isDarkAt, isNightTime } from '../../src/data/theme';
import { timelineMarks } from '../../src/logic/timeline';
import { dayRange } from '../../src/logic/time';

const at = (h: number, mi = 0, day = 21) => new Date(2026, 9, day, h, mi).getTime();
const ev = (id: string, e: Omit<BabyEvent, 'id' | 'createdAt' | 'updatedAt'>): BabyEvent => ({ id, createdAt: e.start, updatedAt: e.start, ...e });

describe('night hours (20:00–07:00 local)', () => {
  it('is night from 20:00 up to 06:59', () => {
    expect(isNightTime(at(19, 59))).toBe(false);
    expect(isNightTime(at(20, 0))).toBe(true);
    expect(isNightTime(at(3, 12))).toBe(true);
    expect(isNightTime(at(6, 59))).toBe(true);
    expect(isNightTime(at(7, 0))).toBe(false);
  });

  it('dark design: always for "dark", only at night for "night", never for "light"', () => {
    expect(isDarkAt('dark', at(12))).toBe(true);
    expect(isDarkAt('night', at(12))).toBe(false);
    expect(isDarkAt('night', at(23))).toBe(true);
    expect(isDarkAt('light', at(23))).toBe(false);
  });
});

describe('day timeline', () => {
  const [dayStart, dayEnd] = dayRange(at(12));

  it('places spans and points as percent of the day; a running span ends now', () => {
    const marks = timelineMarks(
      [
        ev('f', { type: 'feed', side: 'left', start: at(6), end: at(6, 18) }),
        ev('s', { type: 'sleep', start: at(9) }),
        ev('d', { type: 'diaper', diaper: 'wet', start: at(18) }),
      ],
      dayStart,
      dayEnd,
      at(12),
    );
    expect(marks[0]).toMatchObject({ key: 's', kind: 'sleep', left: 37.5, width: 12.5 });
    expect(marks.find((m) => m.key === 'f')).toMatchObject({ left: 25, width: 1.25 });
    expect(marks.find((m) => m.key === 'd')).toMatchObject({ kind: 'diaper', left: 75 });
  });

  it('cuts a sleep over midnight at 0:00 and keeps very short feeds visible', () => {
    const marks = timelineMarks(
      [
        ev('s', { type: 'sleep', start: at(22, 0, 20), end: at(3) }),
        ev('f', { type: 'feed', side: 'right', start: at(10), end: at(10, 1) }),
      ],
      dayStart,
      dayEnd,
      at(12),
    );
    expect(marks.find((m) => m.key === 's')).toMatchObject({ left: 0, width: 12.5 });
    expect(marks.find((m) => m.key === 'f')?.width).toBe(0.5);
  });
});
