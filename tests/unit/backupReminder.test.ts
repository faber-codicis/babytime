import { beforeEach, describe, expect, it } from 'vitest';
import {
  dismissBackupReminder,
  getBackupReminderDismissedAt,
  getLastExportAt,
  setLastExportAt,
} from '../../src/data/appState';
import { deleteAllData } from '../../src/data/backup';
import { db } from '../../src/data/db';
import { addDiaper, getFirstEventStart } from '../../src/data/events';
import { shouldRemindBackup } from '../../src/logic/backupReminder';
import { DAY, formatDaysAgo } from '../../src/logic/time';

const at = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();
const NOW = at(30);

describe('shouldRemindBackup', () => {
  it('stays quiet without entries', () => {
    expect(shouldRemindBackup({ lastExportAt: undefined, firstEventAt: undefined, dismissedAt: undefined, now: NOW })).toBe(false);
  });

  it('without any backup: counts from the oldest entry', () => {
    expect(shouldRemindBackup({ lastExportAt: undefined, firstEventAt: NOW - 13 * DAY, dismissedAt: undefined, now: NOW })).toBe(false);
    expect(shouldRemindBackup({ lastExportAt: undefined, firstEventAt: NOW - 14 * DAY, dismissedAt: undefined, now: NOW })).toBe(true);
  });

  it('with a backup: reminds 14 days after it', () => {
    const firstEventAt = NOW - 60 * DAY;
    expect(shouldRemindBackup({ lastExportAt: NOW - 10 * DAY, firstEventAt, dismissedAt: undefined, now: NOW })).toBe(false);
    expect(shouldRemindBackup({ lastExportAt: NOW - 15 * DAY, firstEventAt, dismissedAt: undefined, now: NOW })).toBe(true);
  });

  it('closing it keeps it away for another 14 days', () => {
    const base = { lastExportAt: NOW - 30 * DAY, firstEventAt: NOW - 60 * DAY };
    expect(shouldRemindBackup({ ...base, dismissedAt: NOW - 1 * DAY, now: NOW })).toBe(false);
    expect(shouldRemindBackup({ ...base, dismissedAt: NOW - 13 * DAY, now: NOW })).toBe(false);
    expect(shouldRemindBackup({ ...base, dismissedAt: NOW - 14 * DAY, now: NOW })).toBe(true);
  });
});

describe('formatDaysAgo', () => {
  it('uses calendar days', () => {
    expect(formatDaysAgo(at(30, 8), NOW)).toBe('heute');
    expect(formatDaysAgo(at(29, 23), at(30, 1))).toBe('gestern');
    expect(formatDaysAgo(at(18), NOW)).toBe('vor 12\u00A0Tagen');
    // Across the DST switch on 25 October.
    expect(formatDaysAgo(at(24), at(26))).toBe('vor 2\u00A0Tagen');
  });
});

describe('backup bookkeeping', () => {
  beforeEach(async () => {
    await db.events.clear();
    await db.kv.clear();
  });

  it('stores the last export and the dismissal; "Alle Daten löschen" resets both', async () => {
    expect(await getLastExportAt()).toBeUndefined();
    await setLastExportAt(at(20));
    await dismissBackupReminder(at(21));
    expect(await getLastExportAt()).toBe(at(20));
    expect(await getBackupReminderDismissedAt()).toBe(at(21));

    await deleteAllData();
    expect(await getLastExportAt()).toBeUndefined();
    expect(await getBackupReminderDismissedAt()).toBeUndefined();
  });

  it('knows the oldest entry', async () => {
    expect(await getFirstEventStart()).toBeUndefined();
    await addDiaper('wet', at(12));
    await addDiaper('dirty', at(3));
    expect(await getFirstEventStart()).toBe(at(3));
  });
});
