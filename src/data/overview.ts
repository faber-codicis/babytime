import { feedSessions, type FeedSession } from '../logic/stats';
import { HOUR } from '../logic/time';
import {
  getEventsBetween,
  getEventsOverlapping,
  getLatest,
  getLatestFinished,
  getLatestFinishedBefore,
  getRunning,
  type BabyEvent,
} from './events';

/** Everything the Today screen shows, read in one live query. */
export interface TodayData {
  runningFeed: BabyEvent | undefined;
  lastFinishedFeed: BabyEvent | undefined;
  /** Session of the last finished feed (both sides after a switch). */
  lastFeedSession: FeedSession | undefined;
  lastDiaper: BabyEvent | undefined;
  runningSleep: BabyEvent | undefined;
  lastFinishedSleep: BabyEvent | undefined;
  /** Events overlapping the local day, for the counters. */
  dayEvents: BabyEvent[];
}

/** A side switch keeps both sides of one feeding within a few hours. */
const SESSION_LOOKBACK = 3 * HOUR;

async function sessionOf(feed: BabyEvent | undefined): Promise<FeedSession | undefined> {
  if (!feed || feed.end === undefined) return undefined;
  const around = await getEventsBetween(feed.start - SESSION_LOOKBACK, feed.end + 1);
  return feedSessions(around).find((s) => s.events.some((e) => e.id === feed.id));
}

/** Everything the running-feed screen shows. */
export interface FeedingData {
  running: BabyEvent | undefined;
  /** The feeding before the current one (not the side just switched away from). */
  previousSession: FeedSession | undefined;
}

export async function loadFeeding(): Promise<FeedingData> {
  const running = await getRunning('feed');
  if (!running) return { running, previousSession: undefined };
  const recent = await getEventsBetween(running.start - SESSION_LOOKBACK, running.start + 1);
  const current = feedSessions(recent).find((s) => s.events.some((e) => e.id === running.id));
  const previous = await getLatestFinishedBefore('feed', current?.start ?? running.start);
  return { running, previousSession: await sessionOf(previous) };
}

export async function loadToday(dayStart: number, dayEnd: number): Promise<TodayData> {
  const [runningFeed, lastFinishedFeed, lastDiaper, runningSleep, lastFinishedSleep, dayEvents] = await Promise.all([
    getRunning('feed'),
    getLatestFinished('feed'),
    getLatest('diaper'),
    getRunning('sleep'),
    getLatestFinished('sleep'),
    getEventsOverlapping(dayStart, dayEnd),
  ]);
  return {
    runningFeed,
    lastFinishedFeed,
    lastFeedSession: await sessionOf(lastFinishedFeed),
    lastDiaper,
    runningSleep,
    lastFinishedSleep,
    dayEvents,
  };
}
