import { db } from './db';

const LAST_SEEN_VERSION = 'lastSeenVersion';

/** Version whose news the user has seen (spec 6.9); undefined on first install or before this feature. */
export async function getLastSeenVersion(): Promise<string | undefined> {
  const value = (await db.kv.get(LAST_SEEN_VERSION))?.value;
  return typeof value === 'string' ? value : undefined;
}

export async function setLastSeenVersion(version: string): Promise<void> {
  await db.kv.put({ key: LAST_SEEN_VERSION, value: version });
}

const LAST_EXPORT_AT = 'lastExportAt';
const BACKUP_REMINDER_DISMISSED_AT = 'backupReminderDismissedAt';

async function getTime(key: string): Promise<number | undefined> {
  const value = (await db.kv.get(key))?.value;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** When a backup file was last handed over (share sheet or download); undefined = never. */
export function getLastExportAt(): Promise<number | undefined> {
  return getTime(LAST_EXPORT_AT);
}

export async function setLastExportAt(at = Date.now()): Promise<void> {
  await db.kv.put({ key: LAST_EXPORT_AT, value: at });
}

/** When the "Zeit für eine Sicherung" card on Today was last closed. */
export function getBackupReminderDismissedAt(): Promise<number | undefined> {
  return getTime(BACKUP_REMINDER_DISMISSED_AT);
}

export async function dismissBackupReminder(at = Date.now()): Promise<void> {
  await db.kv.put({ key: BACKUP_REMINDER_DISMISSED_AT, value: at });
}
