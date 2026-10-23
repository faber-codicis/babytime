import { db } from './db';

/** Remembered one-off UI states (e.g. a dismissed hint). Stored in `kv`, so "Alle Daten löschen" resets them. */
export type Flag = 'installHintDismissed';

export async function getFlag(flag: Flag): Promise<boolean> {
  return (await db.kv.get(flag))?.value === true;
}

export async function setFlag(flag: Flag, value = true): Promise<void> {
  await db.kv.put({ key: flag, value });
}
