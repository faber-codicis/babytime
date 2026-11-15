import type { BabyEvent } from '../data/events';
import type { TodayData } from '../data/overview';
import { formatRelative, formatSince } from '../logic/time';
import { t } from '../strings';
import { EditButton } from './EditButton';
import { Icon, type IconName } from './icons';

function StatusCard(props: {
  tone: 'peach' | 'lavender';
  icon: IconName;
  label: string;
  big: string;
  sub: string;
  running?: boolean;
  edit?: { label: string; event: BabyEvent | undefined; onEdit: ((event: BabyEvent) => void) | undefined };
}) {
  const edit = props.edit;
  return (
    <section class={`card status status--${props.tone}${props.running ? ' is-running' : ''}`} aria-label={props.label}>
      <span class="icon-bubble">
        <Icon name={props.icon} size={18} />
      </span>
      <p class="status-label" aria-hidden="true">
        {props.label}
        {props.running && <span class="live-dot" />}
      </p>
      {edit?.event && edit.onEdit && <EditButton label={edit.label} event={edit.event} onEdit={edit.onEdit} />}
      <p class="status-big">{props.big}</p>
      <p class="status-sub">{props.sub}</p>
    </section>
  );
}

export function StatusCards({
  data,
  now,
  diaper: showDiaper = true,
  sleep: showSleep = true,
  onEdit,
}: {
  data: TodayData | undefined;
  now: number;
  diaper?: boolean;
  sleep?: boolean;
  onEdit?: (event: BabyEvent) => void;
}) {
  if (!showDiaper && !showSleep) return null;
  const diaper = data?.lastDiaper;
  const sleeping = data?.runningSleep;
  const lastSleep = data?.lastFinishedSleep;

  const sleepSince = sleeping?.start ?? lastSleep?.end;
  const sleepSub = sleeping ? t.today.sleeping : lastSleep ? t.today.awake : '';

  return (
    <div class="status-row">
      {showDiaper && (
        <StatusCard
          tone="peach"
          icon="diaper"
          label={t.today.diaper}
          big={diaper ? formatRelative(diaper.start, now) : t.today.noEntry}
          sub={diaper?.diaper ? t.diaper[diaper.diaper] : ''}
          edit={{ label: t.today.editDiaper, event: diaper, onEdit }}
        />
      )}
      {showSleep && (
        <StatusCard
          tone="lavender"
          icon="moon"
          label={t.today.sleep}
          big={sleepSince !== undefined ? formatSince(now - sleepSince) : t.today.noEntry}
          sub={sleepSub}
          running={Boolean(sleeping)}
          edit={{ label: t.today.editSleep, event: sleeping ?? lastSleep, onEdit }}
        />
      )}
    </div>
  );
}
