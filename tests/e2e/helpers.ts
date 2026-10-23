import { expect, type Page } from '@playwright/test';

/** Waits until the static splash is gone. */
export async function waitForApp(page: Page): Promise<void> {
  await expect(page.locator('#splash')).toHaveCount(0);
}

/** Opens the app at `path` and finishes the first start without a name, like a quick tester would. */
export async function openApp(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  await waitForApp(page);
  await page.getByRole('button', { name: 'Ohne Namen fortfahren' }).click();
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible();
}

/** Sets a kv value (e.g. lastSeenVersion) directly in IndexedDB, then reloads like an app restart. */
export async function setKvAndRestart(page: Page, key: string, value: unknown, path?: string): Promise<void> {
  await page.evaluate(
    async ([k, v]) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('babytime');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put({ key: k, value: v });
      await new Promise((resolve) => (tx.oncomplete = resolve));
      db.close();
    },
    [key, value] as const,
  );
  // goto alone does not reload when only the hash is the same; reload makes it a real restart.
  if (path) await page.goto(path);
  await page.reload();
  await waitForApp(page);
}

export type Seed = {
  type: 'feed' | 'diaper' | 'sleep';
  start: number;
  end?: number;
  side?: string;
  diaper?: string;
  note?: string;
};

/** Writes events straight into IndexedDB (schema exists after the first app start), then reloads. */
export async function seed(page: Page, events: Seed[]): Promise<void> {
  await page.evaluate(async (items) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('babytime');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction('events', 'readwrite');
    for (const e of items) tx.objectStore('events').put({ id: crypto.randomUUID(), createdAt: e.start, updatedAt: e.start, ...e });
    await new Promise((resolve) => (tx.oncomplete = resolve));
    db.close();
  }, events);
  await page.reload();
  await waitForApp(page);
}
