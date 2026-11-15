import type { Trackers } from '../data/trackers';
import type { DayStats } from '../logic/stats';
import { split } from '../logic/time';
import { t } from '../strings';

function Stat({ value }: { value: readonly [string, string] }) {
  return (
    <li class="stat">
      <span class="stat-value">{value[0]}</span> <span class="stat-label">{value[1]}</span>
    </li>
  );
}

/** Today's counters as rows of three equal fields (big number, small label); bottle and pump add a second row. */
export function Chips({ stats, show }: { stats: DayStats | undefined; show: Trackers }) {
  if (!stats) return <div class="stats" />;
  const sleep = split(stats.sleepMs);
  return (
    <ul class="stats" aria-label={t.today.countersA11y}>
      {show.feed && <Stat value={t.today.statFeeds(stats.feeds)} />}
      {show.diaper && <Stat value={t.today.statDiapers(stats.diapers)} />}
      {/* Hours and minutes: newborns sleep in many short naps (spec 6.2). */}
      {show.sleep && <Stat value={t.today.statSleep(sleep.h, sleep.m)} />}
      {/* Only on days with a bottle or pumping: a fully breastfed baby keeps the three fields (0.6.0). */}
      {show.bottle && stats.bottleMl > 0 && <Stat value={t.today.statBottle(stats.bottleMl)} />}
      {show.pump && stats.pumpMl > 0 && <Stat value={t.today.statPump(stats.pumpMl)} />}
    </ul>
  );
}
