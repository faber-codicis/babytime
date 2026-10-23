import { describe, expect, it } from 'vitest';
import type { BabyEvent } from '../../src/data/events';
import { dayStats, feedSessions, sessionDuration } from '../../src/logic/stats';
import { nextSide } from '../../src/logic/nextSide';
import { HOUR, MINUTE, dayRange } from '../../src/logic/time';

const at = (h: number, mi = 0, day = 21) => new Date(2026, 9, day, h, mi).getTime();
let seq = 0;
const ev = (e: Omit<BabyEvent, 'id' | 'createdAt' | 'updatedAt'>): BabyEvent => ({
  id: `id-${++seq}`,
  createdAt: e.start,
  updatedAt: e.start,
  ...e,
});

describe('feedSessions', () => {
  it('joins a side switch into one session', () => {
    const left = ev({ type: 'feed', side: 'left', start: at(12, 0), end: at(12, 10) });
    const right = ev({ type: 'feed', side: 'right', start: at(12, 10), end: at(12, 18) });
    const later = ev({ type: 'feed', side: 'left', start: at(15, 0), end: at(15, 12) });

    const sessions = feedSessions([later, right, left]);
    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toMatchObject({ start: at(12, 0), end: at(12, 18), lastSide: 'right' });
    expect(sessionDuration(sessions[0]!, at(16))).toBe(18 * MINUTE);
  });

  it('keeps a session open while its last side runs', () => {
    const left = ev({ type: 'feed', side: 'left', start: at(12, 0), end: at(12, 10) });
    const right = ev({ type: 'feed', side: 'right', start: at(12, 10) });
    const [session] = feedSessions([left, right]);
    expect(session?.end).toBeUndefined();
    expect(sessionDuration(session!, at(12, 15))).toBe(15 * MINUTE);
  });
});

describe('dayStats', () => {
  const [dayStart, dayEnd] = dayRange(at(12));

  it('counts feeds as sessions, diapers by start, and only today', () => {
    const events = [
      ev({ type: 'feed', side: 'left', start: at(23, 30, 20), end: at(23, 50, 20) }), // yesterday
      ev({ type: 'feed', side: 'left', start: at(3, 0), end: at(3, 10) }),
      ev({ type: 'feed', side: 'right', start: at(3, 10), end: at(3, 20) }), // same session
      ev({ type: 'feed', side: 'left', start: at(7, 0), end: at(7, 15) }),
      ev({ type: 'diaper', diaper: 'wet', start: at(23, 55, 20) }), // yesterday
      ev({ type: 'diaper', diaper: 'wet', start: at(4, 0) }),
      ev({ type: 'diaper', diaper: 'both', start: at(9, 0) }),
    ];
    const stats = dayStats(events, dayStart, dayEnd, at(14, 20));
    expect(stats.feeds).toBe(2);
    expect(stats.diapers).toBe(2);
  });

  it('sums sleep from midnight and counts a running sleep until now', () => {
    const events = [
      ev({ type: 'sleep', start: at(22, 0, 20), end: at(2, 30) }), // 2.5 h after midnight
      ev({ type: 'sleep', start: at(4, 0), end: at(6, 0) }), // 2 h
      ev({ type: 'sleep', start: at(13, 0) }), // running, 1 h 20 min until now
    ];
    const stats = dayStats(events, dayStart, dayEnd, at(14, 20));
    expect(stats.sleepMs).toBe(5 * HOUR + 50 * MINUTE);
  });

  it('keeps short naps (newborn pattern) to the minute', () => {
    const naps = [1, 3, 5, 8, 10, 12, 15, 18].map((h) => ev({ type: 'sleep', start: at(h), end: at(h, 50) }));
    expect(dayStats(naps, dayStart, dayEnd, at(20)).sleepMs).toBe(6 * HOUR + 40 * MINUTE);
  });

  it('is empty without events', () => {
    expect(dayStats([], dayStart, dayEnd, at(14))).toEqual({ feeds: 0, diapers: 0, sleepMs: 0 });
  });
});

describe('nextSide', () => {
  it('is the opposite of the last finished feed', () => {
    expect(nextSide({ side: 'right', end: at(12, 40) })).toBe('left');
    expect(nextSide({ side: 'left', end: at(12, 40) })).toBe('right');
  });

  it('starts left without a finished feed', () => {
    expect(nextSide(undefined)).toBe('left');
    expect(nextSide({ side: 'right' })).toBe('left');
  });
});
