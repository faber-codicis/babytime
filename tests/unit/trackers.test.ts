import { describe, expect, it } from 'vitest';
import { DEFAULT_TRACKERS, getTrackers, isLastTracker, sanitizeTrackers, setTracker } from '../../src/data/trackers';

describe('tracker switches', () => {
  it('everything is on by default; unknown keys and non-booleans are dropped', () => {
    expect(sanitizeTrackers(undefined)).toEqual(DEFAULT_TRACKERS);
    expect(sanitizeTrackers({ pump: false, bottle: 'no', evil: true })).toEqual({ ...DEFAULT_TRACKERS, pump: false });
  });

  it('never leaves all trackers off (Stillen comes back on); the timeline may be off', () => {
    const off = { feed: false, bottle: false, pump: false, diaper: false, sleep: false, timeline: false, milestones: false };
    expect(sanitizeTrackers(off)).toEqual({ ...off, feed: true });
    expect(isLastTracker({ ...off, sleep: true }, 'sleep')).toBe(true);
    expect(isLastTracker({ ...off, sleep: true }, 'timeline')).toBe(false);
    expect(isLastTracker({ ...off, sleep: true }, 'milestones')).toBe(false);
    expect(isLastTracker(DEFAULT_TRACKERS, 'sleep')).toBe(false);
  });

  it('is saved and read back', async () => {
    await setTracker('bottle', false);
    expect(await getTrackers()).toEqual({ ...DEFAULT_TRACKERS, bottle: false });
    await setTracker('bottle', true);
    expect(await getTrackers()).toEqual(DEFAULT_TRACKERS);
  });
});
