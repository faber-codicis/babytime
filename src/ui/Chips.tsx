import type { DayStats } from '../logic/stats';
import { formatDuration } from '../logic/time';
import { t } from '../strings.de';

export function Chips({ stats }: { stats: DayStats | undefined }) {
  if (!stats) return <div class="chips" />;
  return (
    <ul class="chips" aria-label={t.today.countersA11y}>
      <li class="chip">{t.today.chipFeeds(stats.feeds)}</li>
      <li class="chip">{t.today.chipDiapers(stats.diapers)}</li>
      {/* Hours and minutes: newborns sleep in many short naps (spec 6.2). */}
      <li class="chip">{t.today.chipSleep(formatDuration(stats.sleepMs))}</li>
    </ul>
  );
}
