import type { BabyEvent, Side } from '../data/events';

/**
 * Next breast to offer: the opposite of the last *finished* feed.
 * A running feed does not count; with no finished feed yet, start left.
 */
export function nextSide(lastFinishedFeed: Pick<BabyEvent, 'side' | 'end'> | undefined): Side {
  if (!lastFinishedFeed || lastFinishedFeed.end === undefined || !lastFinishedFeed.side) return 'left';
  return lastFinishedFeed.side === 'left' ? 'right' : 'left';
}
