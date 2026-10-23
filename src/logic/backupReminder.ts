import { DAY } from './time';

/** No backup for this long → remind; closed reminders stay away for this long too. */
export const BACKUP_REMINDER_AFTER = 14 * DAY;

export interface BackupReminderInput {
  lastExportAt: number | undefined;
  /** Start of the oldest entry; undefined = no entries, nothing to back up. */
  firstEventAt: number | undefined;
  dismissedAt: number | undefined;
  now: number;
}

/**
 * Show "Zeit für eine Sicherung" once the last backup is 14 days old – or, without any backup,
 * once the oldest entry is – unless the card was closed within the last 14 days.
 */
export function shouldRemindBackup({ lastExportAt, firstEventAt, dismissedAt, now }: BackupReminderInput): boolean {
  if (firstEventAt === undefined) return false;
  const since = lastExportAt ?? firstEventAt;
  if (now - since < BACKUP_REMINDER_AFTER) return false;
  return dismissedAt === undefined || now - dismissedAt >= BACKUP_REMINDER_AFTER;
}
