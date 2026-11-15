import { dismissBackupReminder, getBackupReminderDismissedAt, getLastExportAt } from '../data/appState';
import { getFirstEventStart } from '../data/events';
import { shouldRemindBackup } from '../logic/backupReminder';
import { formatDaysAgo } from '../logic/time';
import { t } from '../strings';
import { useLive } from './hooks';
import { Icon } from './icons';
import { useExport } from './useDataActions';

/** The card itself; mounted only when due, so the export file is only prepared then. */
function ReminderCard({ lastExportAt, now, onMessage }: { lastExportAt: number | undefined; now: number; onMessage: (text: string) => void }) {
  const exportNow = useExport(onMessage);
  return (
    <section class="backup-reminder" aria-labelledby="backup-reminder-title">
      <span class="backup-reminder-icon" aria-hidden="true">
        <Icon name="download" size={18} />
      </span>
      <div class="backup-reminder-text">
        <h2 id="backup-reminder-title" class="backup-reminder-title">
          {t.backupReminder.title}
        </h2>
        <p class="backup-reminder-sub">
          {lastExportAt === undefined ? t.backupReminder.never : t.backupReminder.since(formatDaysAgo(lastExportAt, now))}
        </p>
        <button type="button" class="pill-btn pill-btn--rose" disabled={!exportNow} onClick={() => exportNow?.()}>
          {t.backupReminder.action}
        </button>
      </div>
      <button type="button" class="install-hint-close" aria-label={t.backupReminder.close} onClick={() => void dismissBackupReminder()}>
        <Icon name="close" size={18} />
      </button>
    </section>
  );
}

/**
 * "Zeit für eine Sicherung" on Today (0.4.0): after 14 days without a backup; closing it keeps it
 * away for another 14 days. Hidden while a feed is running.
 */
export function BackupReminder(props: { now: number; feeding: boolean; onMessage: (text: string) => void }) {
  const state = useLive(
    async () => ({
      lastExportAt: await getLastExportAt(),
      firstEventAt: await getFirstEventStart(),
      dismissedAt: await getBackupReminderDismissedAt(),
    }),
    [],
  );
  if (!state || props.feeding || !shouldRemindBackup({ ...state, now: props.now })) return null;
  return <ReminderCard lastExportAt={state.lastExportAt} now={props.now} onMessage={props.onMessage} />;
}
