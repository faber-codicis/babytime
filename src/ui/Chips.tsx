import type { DayStats } from '../logic/stats';
import { split } from '../logic/time';
import { t } from '../strings.de';

function Stat({ value }: { value: readonly [string, string] }) {
  return (
    <li class="stat">
      <span class="stat-value">{value[0]}</span> <span class="stat-label">{value[1]}</span>
    </li>
  );
}

/** Today's counters as one fixed row of three equal fields (big number, small label), never wrapping. */
export function Chips({ stats }: { stats: DayStats | undefined }) {
  if (!stats) return <div class="stats" />;
  const sleep = split(stats.sleepMs);
  return (
    <ul class="stats" aria-label={t.today.countersA11y}>
      <Stat value={t.today.statFeeds(stats.feeds)} />
      <Stat value={t.today.statDiapers(stats.diapers)} />
      {/* Hours and minutes: newborns sleep in many short naps (spec 6.2). */}
      <Stat value={t.today.statSleep(sleep.h, sleep.m)} />
    </ul>
  );
}
