import { describe, expect, it } from 'vitest';
import {
  DAY,
  HOUR,
  MINUTE,
  addDays,
  ageInDays,
  birthDateProblem,
  dayRange,
  earliestBirthDate,
  formatAge,
  formatClock,
  formatDuration,
  formatDurationLong,
  formatElapsed,
  formatRelative,
  formatSince,
  formatTimer,
  formatWeekday,
  startOfDay,
} from '../../src/logic/time';

const at = (y: number, mo: number, d: number, h = 0, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime();
const NOW = at(2026, 10, 21, 14, 20); // Wednesday

describe('relative time', () => {
  it('follows the spec wording', () => {
    expect(formatRelative(NOW - 20_000, NOW)).toBe('gerade eben');
    expect(formatRelative(NOW - 35 * MINUTE, NOW)).toBe('vor 35\u00A0Min');
    expect(formatRelative(NOW - 59 * MINUTE - 59_000, NOW)).toBe('vor 59\u00A0Min');
    expect(formatRelative(NOW - 60 * MINUTE, NOW)).toBe('vor 1\u00A0Std');
    expect(formatRelative(NOW - 100 * MINUTE, NOW)).toBe('vor 1\u00A0Std 40\u00A0Min');
    expect(formatRelative(NOW - DAY, NOW)).toBe('vor 1\u00A0Tag');
    expect(formatRelative(NOW - 2 * DAY - HOUR, NOW)).toBe('vor 2\u00A0Tagen');
  });

  it('treats future timestamps (clock skew) as just now', () => {
    expect(formatRelative(NOW + 5 * MINUTE, NOW)).toBe('gerade eben');
  });
});

describe('durations', () => {
  it('formats short and long variants', () => {
    expect(formatDuration(0)).toBe('0\u00A0Min');
    expect(formatDuration(18 * MINUTE + 59_000)).toBe('18\u00A0Min');
    expect(formatDuration(2 * HOUR)).toBe('2\u00A0Std');
    expect(formatDuration(HOUR + 40 * MINUTE)).toBe('1\u00A0Std 40\u00A0Min');
    expect(formatDurationLong(MINUTE)).toBe('1\u00A0Minute');
    expect(formatDurationLong(18 * MINUTE)).toBe('18\u00A0Minuten');
    expect(formatDurationLong(2 * HOUR + 10 * MINUTE)).toBe('2\u00A0Std 10\u00A0Min');
  });

  it('says "gerade eben" instead of 0 minutes', () => {
    expect(formatElapsed(30_000)).toBe('gerade eben');
    expect(formatElapsed(HOUR + 40 * MINUTE)).toBe('1\u00A0Std 40\u00A0Min');
    expect(formatSince(59_000)).toBe('gerade eben');
    expect(formatSince(25 * MINUTE)).toBe('seit 25\u00A0Min');
  });

  it('formats the timer as mm:ss', () => {
    expect(formatTimer(0)).toBe('00:00');
    expect(formatTimer(7 * MINUTE + 42_500)).toBe('07:42');
    expect(formatTimer(72 * MINUTE + 5_000)).toBe('72:05');
  });
});

describe('day boundaries (local time zone)', () => {
  it('starts the day at local midnight', () => {
    expect(startOfDay(NOW)).toBe(at(2026, 10, 21));
    expect(dayRange(NOW)).toEqual([at(2026, 10, 21), at(2026, 10, 22)]);
  });

  it('handles the DST switch (25 hour day)', () => {
    const dstDay = at(2026, 10, 25, 12);
    const [start, end] = dayRange(dstDay);
    expect(end - start).toBe(25 * HOUR);
    expect(addDays(start, 1)).toBe(at(2026, 10, 26));
  });
});

describe('birth date range and age display', () => {
  it('accepts today back to 24 months, rejects future and older', () => {
    expect(earliestBirthDate(NOW)).toBe('2024-10-21');
    expect(birthDateProblem('2026-10-21', NOW)).toBeUndefined();
    expect(birthDateProblem('2024-10-21', NOW)).toBeUndefined();
    expect(birthDateProblem('2024-10-20', NOW)).toBe('tooOld');
    expect(birthDateProblem('1990-05-05', NOW)).toBe('tooOld');
    expect(birthDateProblem('2026-10-22', NOW)).toBe('future');
  });

  it('shows days, then weeks, then months, then years', () => {
    expect(formatAge('2026-10-21', NOW)).toBe('heute geboren');
    expect(formatAge('2026-10-20', NOW)).toBe('1\u00A0Tag alt');
    expect(formatAge('2026-10-09', NOW)).toBe('12\u00A0Tage alt');
    expect(formatAge('2026-10-07', NOW)).toBe('2\u00A0Wochen alt'); // 14 days
    expect(formatAge('2026-09-02', NOW)).toBe('7\u00A0Wochen alt'); // 49 days
    expect(formatAge('2026-08-21', NOW)).toBe('8\u00A0Wochen alt'); // exactly 2 months = 61 days
    expect(formatAge('2026-07-22', NOW)).toBe('13\u00A0Wochen alt'); // 91 days, 2 completed months
    expect(formatAge('2026-07-21', NOW)).toBe('3\u00A0Monate alt'); // from 3 completed months on: months
    expect(formatAge('2025-10-22', NOW)).toBe('11\u00A0Monate alt');
    expect(formatAge('2025-10-21', NOW)).toBe('12\u00A0Monate alt');
    expect(formatAge('2025-01-15', NOW)).toBe('21\u00A0Monate alt');
    expect(formatAge('2024-10-21', NOW)).toBe('2\u00A0Jahre alt');
    expect(formatAge('2026-11-01', NOW)).toBeUndefined();
    expect(formatAge('kaputt', NOW)).toBeUndefined();
  });
});

describe('clock and age', () => {
  it('formats clock and weekday in German', () => {
    expect(formatClock(at(2026, 10, 21, 7, 42))).toBe('07:42');
    expect(formatClock(NOW)).toBe('14:20');
    expect(formatWeekday(NOW)).toBe('Mittwoch');
  });

  it('counts calendar days since birth, across DST', () => {
    expect(ageInDays('2026-10-09', NOW)).toBe(12);
    expect(ageInDays('2026-10-21', NOW)).toBe(0);
    expect(ageInDays('2026-10-20', at(2026, 10, 26, 0, 30))).toBe(6);
    expect(ageInDays('2026-11-01', NOW)).toBeUndefined();
    expect(ageInDays('kaputt', NOW)).toBeUndefined();
  });
});
