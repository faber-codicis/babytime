import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/data/db';
import {
  addDiaper,
  cancelFeed,
  finishFeed,
  getEventsOverlapping,
  getLatest,
  getLatestFinished,
  getRunning,
  startFeed,
  switchFeedSide,
  toggleSleep,
} from '../../src/data/events';

const MIN = 60_000;
const T0 = new Date(2026, 9, 21, 14, 0).getTime();

const runningCount = async (type: 'feed' | 'sleep') =>
  (await db.events.where('type').equals(type).toArray()).filter((e) => e.end === undefined).length;

beforeEach(async () => {
  await db.events.clear();
  await db.kv.clear();
});

describe('feed', () => {
  it('starts a running feed with exactly one side', async () => {
    const event = await startFeed('left', T0);
    expect(event).toMatchObject({ type: 'feed', side: 'left', start: T0 });
    expect(event.end).toBeUndefined();
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await getRunning('feed')).toEqual(event);
  });

  it('never runs two feeds at once (double tap returns the running one)', async () => {
    const first = await startFeed('left', T0);
    const second = await startFeed('right', T0 + MIN);
    expect(second.id).toBe(first.id);
    expect(await runningCount('feed')).toBe(1);
  });

  it('switching sides ends the running feed and starts a new one on the other side', async () => {
    const left = await startFeed('left', T0);
    const right = await switchFeedSide('right', T0 + 10 * MIN);

    expect(await db.events.get(left.id)).toMatchObject({ side: 'left', end: T0 + 10 * MIN });
    expect(right).toMatchObject({ type: 'feed', side: 'right', start: T0 + 10 * MIN });
    expect(right.end).toBeUndefined();
    expect(await runningCount('feed')).toBe(1);

    const leftAgain = await switchFeedSide('left', T0 + 15 * MIN);
    expect(leftAgain.side).toBe('left');
    expect(await db.events.count()).toBe(3);
    expect(await runningCount('feed')).toBe(1);
  });

  it('a double tap on the same side does not switch back', async () => {
    await startFeed('left', T0);
    const first = await switchFeedSide('right', T0 + 10 * MIN);
    const second = await switchFeedSide('right', T0 + 10 * MIN + 300);
    expect(second.id).toBe(first.id);
    expect(await db.events.count()).toBe(2);
  });

  it('finishing sets end; cancelling discards only the running side', async () => {
    await startFeed('left', T0);
    await switchFeedSide('right', T0 + 10 * MIN);
    await cancelFeed();
    expect(await getRunning('feed')).toBeUndefined();
    expect(await db.events.count()).toBe(1);

    await startFeed('right', T0 + 20 * MIN);
    const done = await finishFeed(T0 + 38 * MIN);
    expect(done).toMatchObject({ side: 'right', end: T0 + 38 * MIN });
    expect(await getLatestFinished('feed')).toEqual(done);
    expect(await finishFeed(T0 + 40 * MIN)).toBeUndefined();
  });

  it('never stores an end before the start, even if the clock jumped back', async () => {
    await startFeed('left', T0);
    const done = await finishFeed(T0 - 5 * MIN);
    expect(done?.end).toBe(T0);
  });
});

describe('diaper', () => {
  it('stores a point in time without end, and undo removes it', async () => {
    const change = await addDiaper('wet', T0);
    expect(change.event).toMatchObject({ type: 'diaper', diaper: 'wet', start: T0 });
    expect(change.event.end).toBeUndefined();
    expect(await getLatest('diaper')).toEqual(change.event);

    await change.undo();
    expect(await db.events.count()).toBe(0);
  });
});

describe('sleep', () => {
  it('toggles start and end with one call each, at most one running', async () => {
    const started = await toggleSleep(T0);
    expect(started.action).toBe('started');
    expect(await runningCount('sleep')).toBe(1);

    const ended = await toggleSleep(T0 + 90 * MIN);
    expect(ended.action).toBe('ended');
    expect(ended.event).toMatchObject({ id: started.event.id, end: T0 + 90 * MIN });
    expect(await runningCount('sleep')).toBe(0);
  });

  it('undo after "Wach" makes the sleep run again; undo after start removes it', async () => {
    await toggleSleep(T0);
    const ended = await toggleSleep(T0 + 30 * MIN);
    await ended.undo();
    expect((await getRunning('sleep'))?.end).toBeUndefined();

    const running = await getRunning('sleep');
    await (await toggleSleep(T0 + 40 * MIN)).undo();
    expect(await getRunning('sleep')).toEqual(running);

    await db.events.clear();
    const started = await toggleSleep(T0);
    await started.undo();
    expect(await db.events.count()).toBe(0);
  });
});

describe('getEventsOverlapping', () => {
  it('includes events running into the range but not diapers before it', async () => {
    const dayStart = T0;
    await addDiaper('wet', dayStart - 30 * MIN);
    await toggleSleep(dayStart - 60 * MIN); // still running
    const inRange = await addDiaper('dirty', dayStart + 5 * MIN);

    const found = await getEventsOverlapping(dayStart, dayStart + 24 * 60 * MIN);
    expect(found.map((e) => e.type).sort()).toEqual(['diaper', 'sleep']);
    expect(found.find((e) => e.type === 'diaper')?.id).toBe(inRange.event.id);
  });
});
