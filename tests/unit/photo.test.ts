import { beforeEach, describe, expect, it } from 'vitest';
import { buildExport, deleteAllData, importBackup, parseBackup } from '../../src/data/backup';
import { db } from '../../src/data/db';
import { centerSquare, isPhotoDataUrl, PHOTO_MAX_CHARS } from '../../src/data/photo';
import { getProfile, sanitizeProfile, saveProfile } from '../../src/data/profile';

// Not a real photo: a few base64 characters with a JPEG prefix are enough for the checks.
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJ';

beforeEach(async () => {
  await db.kv.clear();
  await db.events.clear();
});

describe('baby photo (0.18.0)', () => {
  it('accepts only small JPEG data URLs', () => {
    expect(isPhotoDataUrl(PHOTO)).toBe(true);
    expect(isPhotoDataUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(false);
    expect(isPhotoDataUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isPhotoDataUrl('https://example.com/baby.jpg')).toBe(false);
    expect(isPhotoDataUrl('data:image/jpeg;base64,abc"onerror="x')).toBe(false);
    expect(isPhotoDataUrl(`data:image/jpeg;base64,${'A'.repeat(PHOTO_MAX_CHARS)}`)).toBe(false);
    expect(isPhotoDataUrl(42)).toBe(false);
  });

  it('keeps the centre square of landscape and portrait pictures', () => {
    expect(centerSquare(4000, 3000)).toEqual({ sx: 500, sy: 0, side: 3000 });
    expect(centerSquare(3000, 4000)).toEqual({ sx: 0, sy: 500, side: 3000 });
    expect(centerSquare(256, 256)).toEqual({ sx: 0, sy: 0, side: 256 });
  });

  it('is part of the profile and dropped when invalid', async () => {
    await saveProfile({ babyName: 'Lena', photo: PHOTO, onboarded: true });
    expect(await getProfile()).toEqual({ babyName: 'Lena', photo: PHOTO, onboarded: true });
    expect(sanitizeProfile({ onboarded: true, photo: 'javascript:alert(1)' })).toEqual({ onboarded: true });
    await saveProfile({ babyName: 'Lena', onboarded: true });
    expect((await getProfile()).photo).toBeUndefined();
  });

  it('goes into the backup, comes back on restore and is gone after "Alle Daten löschen"', async () => {
    await saveProfile({ babyName: 'Lena', photo: PHOTO, onboarded: true });
    const backup = await buildExport();
    expect(backup.profile.photo).toBe(PHOTO);

    await deleteAllData();
    expect((await getProfile()).photo).toBeUndefined();

    await importBackup(parseBackup(JSON.stringify(backup)), 'replace');
    expect((await getProfile()).photo).toBe(PHOTO);
  });
});
