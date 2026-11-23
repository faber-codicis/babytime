import { expect, test, type Page } from '@playwright/test';
import { openApp, openSettings } from './helpers';

/**
 * Babyfoto (0.18.0). No real photos: the test draws a picture in the browser, encodes it as JPEG and puts an
 * EXIF block with a fake GPS marker into it, like a phone camera would. The app must keep only the pixels.
 */
async function makeCameraJpeg(page: Page, width: number, height: number): Promise<Buffer> {
  const base64 = await page.evaluate(
    async ([w, h]) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#e9c3b4';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#9dbfd6';
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9));
      const jpeg = new Uint8Array(await blob.arrayBuffer());
      // APP1 segment: "Exif\0\0" followed by a marker text standing in for GPS data.
      const payload = new TextEncoder().encode('Exif\0\0GPS-48.2082N-16.3738E-Testkamera');
      const len = payload.length + 2;
      const app1 = new Uint8Array([0xff, 0xe1, len >> 8, len & 0xff, ...payload]);
      const out = new Uint8Array(jpeg.length + app1.length);
      out.set(jpeg.subarray(0, 2)); // SOI
      out.set(app1, 2);
      out.set(jpeg.subarray(2), 2 + app1.length);
      let s = '';
      for (const b of out) s += String.fromCharCode(b);
      return btoa(s);
    },
    [width, height] as const,
  );
  const buffer = Buffer.from(base64, 'base64');
  expect(buffer.toString('latin1')).toContain('GPS-48.2082N');
  return buffer;
}

test.describe('baby photo', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('pick, save without metadata, show on Today and Settings, note in backup, remove', async ({ page }) => {
    await openSettings(page);
    const main = page.getByRole('main');
    await main.getByRole('button', { name: 'Profil bearbeiten' }).click();
    const sheet = page.getByRole('dialog', { name: 'Profil bearbeiten' });
    await expect(sheet.getByText(/Das Foto bleibt nur auf diesem Handy/)).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Entfernen' })).toHaveCount(0);

    const jpeg = await makeCameraJpeg(page, 1200, 800);
    await sheet.locator('#profile-photo').setInputFiles({ name: 'IMG_0001.jpg', mimeType: 'image/jpeg', buffer: jpeg });
    await expect(sheet.getByRole('button', { name: 'Foto ändern' })).toBeVisible();
    await expect(sheet.getByText(/Ort und Kameradaten wurden entfernt/)).toBeVisible();
    await sheet.getByRole('button', { name: 'Speichern' }).click();
    await expect(sheet).toHaveCount(0);

    // Stored: a small square JPEG with only pixels left.
    const stored = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve) => {
        const req = indexedDB.open('babytime');
        req.onsuccess = () => resolve(req.result);
      });
      const value = await new Promise<{ value: { photo?: string } }>((resolve) => {
        const req = db.transaction('kv').objectStore('kv').get('profile');
        req.onsuccess = () => resolve(req.result);
      });
      db.close();
      const photo = value.value.photo!;
      const img = new Image();
      img.src = photo;
      await img.decode();
      return { photo, width: img.naturalWidth, height: img.naturalHeight, bytes: atob(photo.split(',')[1]!) };
    });
    expect(stored.photo.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect([stored.width, stored.height]).toEqual([256, 256]);
    expect(stored.bytes).not.toContain('Exif');
    expect(stored.bytes).not.toContain('GPS-48.2082N');
    expect(stored.photo.length).toBeLessThan(60_000);

    await expect(main.locator('.profile-card .avatar img')).toHaveAttribute('src', stored.photo);
    await openSettings(page, 'Daten & Backup');
    await expect(page.getByText('Die Sicherung enthält auch das Babyfoto.')).toBeVisible();

    await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Heute' }).click();
    await expect(page.locator('.header .avatar img')).toHaveAttribute('src', stored.photo);

    // Remove: takes effect with "Speichern", then the logo face is back.
    await openSettings(page);
    await main.getByRole('button', { name: 'Profil bearbeiten' }).click();
    await sheet.getByRole('button', { name: 'Entfernen' }).click();
    await expect(sheet.getByRole('button', { name: 'Foto wählen' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Speichern' }).click();
    await expect(main.locator('.profile-card .avatar img')).toHaveCount(0);
    await openSettings(page, 'Daten & Backup');
    await expect(page.getByText('Die Sicherung enthält auch das Babyfoto.')).toHaveCount(0);
  });

  test('a file that is no picture shows a message and changes nothing', async ({ page }) => {
    await openSettings(page);
    await page.getByRole('main').getByRole('button', { name: 'Profil bearbeiten' }).click();
    const sheet = page.getByRole('dialog', { name: 'Profil bearbeiten' });
    await sheet.locator('#profile-photo').setInputFiles({ name: 'kaputt.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('kein Bild') });
    await expect(sheet.getByRole('alert')).toHaveText(/Dieses Bild lässt sich nicht öffnen/);
    await expect(sheet.getByRole('button', { name: 'Foto wählen' })).toBeVisible();
  });
});
