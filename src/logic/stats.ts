import type { BabyEvent, Side } from '../data/events';
import { MINUTE } from './time';

/** Feed events closer than this count as one session (a side switch starts the next event at once). */
const SESSION_GAP = MINUTE;

export interface FeedSession {
  start: number;
  end?: number; // missing while the last side is still running
  lastSide?: Side;
  events: BabyEvent[];
}

/** Groups feed events into sessions: a side switch is part of the same feeding. */
export function feedSessions(events: readonly BabyEvent[]): FeedSession[] {
  const feeds = events.filter((e) => e.type === 'feed').sort((a, b) => a.start - b.start);
  const sessions: FeedSession[] = [];
  for (const feed of feeds) {
    const current = sessions.at(-1);
    if (current && current.end !== undefined && feed.start - current.end <= SESSION_GAP) {
      current.events.push(feed);
      setEnd(current, feed);
    } else {
      const session: FeedSession = { start: feed.start, events: [feed] };
      setEnd(session, feed);
      sessions.push(session);
    }
  }
  return sessions;
}

function setEnd(session: FeedSession, feed: BabyEvent): void {
  if (feed.end === undefined) delete session.end;
  else session.end = feed.end;
  if (feed.side) session.lastSide = feed.side;
}

/** Time actually fed in a session (sum of its sides, running side counted until `now`). */
export function sessionDuration(session: FeedSession, now: number): number {
  return session.events.reduce((sum, e) => sum + Math.max(0, (e.end ?? now) - e.start), 0);
}

export interface DayStats {
  feeds: number;
  diapers: number;
  sleepMs: number;
  /** Bottles given and their millilitres (since 0.6.0). */
  bottles: number;
  bottleMl: number;
  /** Millilitres pumped. */
  pumpMl: number;
}

/**
 * Counters for the local day [dayStart, dayEnd).
 * Feeds, diapers, bottles and pumping count by start time; sleep counts the part inside the day, a running sleep until `now`.
 */
export function dayStats(events: readonly BabyEvent[], dayStart: number, dayEnd: number, now: number): DayStats {
  const inDay = (ts: number) => ts >= dayStart && ts < dayEnd;
  const feeds = feedSessions(events).filter((s) => inDay(s.start)).length;
  const diapers = events.filter((e) => e.type === 'diaper' && inDay(e.start)).length;

  const until = Math.min(dayEnd, now);
  const sleepMs = events
    .filter((e) => e.type === 'sleep')
    .reduce((sum, e) => {
      const from = Math.max(e.start, dayStart);
      const to = Math.min(e.end ?? now, until);
      return sum + Math.max(0, to - from);
    }, 0);

  const sumMl = (type: 'bottle' | 'pump') =>
    events.filter((e) => e.type === type && inDay(e.start)).reduce((sum, e) => sum + (e.amountMl ?? 0), 0);
  const bottles = events.filter((e) => e.type === 'bottle' && inDay(e.start)).length;

  return { feeds, diapers, sleepMs, bottles, bottleMl: sumMl('bottle'), pumpMl: sumMl('pump') };
}
