import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/data/db';
import { finishFeed, startFeed, switchFeedSide } from '../../src/data/events';
import { loadFeeding, loadToday } from '../../src/data/overview';
import { dayRange } from '../../src/logic/time';

const MIN = 60_000;
const at = (h: number, m = 0) => new Date(2026, 9, 21, h, m).getTime();

beforeEach(async () => {
  await db.events.clear();
});

describe('loadFeeding', () => {
  it('shows the previous feeding, not the side just switched away from', async () => {
    await startFeed('right', at(12, 22));
    await finishFeed(at(12, 40));

    await startFeed('left', at(14, 12));
    await switchFeedSide('right', at(14, 20));

    const { running, previousSession } = await loadFeeding();
    expect(running).toMatchObject({ side: 'right', start: at(14, 20) });
    expect(previousSession).toMatchObject({ lastSide: 'right', start: at(12, 22), end: at(12, 40) });
  });

  it('has nothing to show without a running feed', async () => {
    expect(await loadFeeding()).toEqual({ running: undefined, previousSession: undefined });
  });
});

describe('loadToday', () => {
  it('reports the whole last session (both sides) and the running feed', async () => {
    await startFeed('left', at(12, 0));
    await switchFeedSide('right', at(12, 10));
    await finishFeed(at(12, 18));

    const data = await loadToday(...dayRange(at(14)));
    expect(data.lastFeedSession).toMatchObject({ start: at(12, 0), end: at(12, 18), lastSide: 'right' });
    expect(data.lastFeedSession?.events).toHaveLength(2);
    expect(data.runningFeed).toBeUndefined();

    await startFeed('left', at(14, 0) + MIN);
    expect((await loadToday(...dayRange(at(14)))).runningFeed?.side).toBe('left');
  });
});
