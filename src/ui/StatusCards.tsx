import type { TodayData } from '../data/overview';
import { formatRelative, formatSince } from '../logic/time';
import { t } from '../strings.de';
import { Icon, type IconName } from './icons';

function StatusCard(props: { tone: 'peach' | 'lavender'; icon: IconName; label: string; big: string; sub: string }) {
  return (
    <section class={`card status status--${props.tone}`} aria-label={props.label}>
      <span class="icon-bubble">
        <Icon name={props.icon} size={18} />
      </span>
      <p class="status-label" aria-hidden="true">
        {props.label}
      </p>
      <p class="status-big">{props.big}</p>
      <p class="status-sub">{props.sub}</p>
    </section>
  );
}

export function StatusCards({ data, now }: { data: TodayData | undefined; now: number }) {
  const diaper = data?.lastDiaper;
  const sleeping = data?.runningSleep;
  const lastSleep = data?.lastFinishedSleep;

  const sleepSince = sleeping?.start ?? lastSleep?.end;
  const sleepSub = sleeping ? t.today.sleeping : lastSleep ? t.today.awake : '';

  return (
    <div class="status-row">
      <StatusCard
        tone="peach"
        icon="diaper"
        label={t.today.diaper}
        big={diaper ? formatRelative(diaper.start, now) : t.today.noEntry}
        sub={diaper?.diaper ? t.diaper[diaper.diaper] : ''}
      />
      <StatusCard
        tone="lavender"
        icon="moon"
        label={t.today.sleep}
        big={sleepSince !== undefined ? formatSince(now - sleepSince) : t.today.noEntry}
        sub={sleepSub}
      />
    </div>
  );
}
