/**
 * Optional baby photo (0.18.0). It lives only in the profile on this phone (IndexedDB) and in backups the
 * user saves. Before it is stored it is cropped to a square, scaled down and encoded again as JPEG
 * (src/ui/photoFile.ts), which drops all metadata such as GPS position, camera and time.
 */

/** Edge length of the stored square in pixels: sharp on the 112 px circle at 2x. */
export const PHOTO_SIZE = 256;
/** Upper bound for a stored photo as data URL (a 256 px JPEG is about 20–40 KB, base64 a third more). */
export const PHOTO_MAX_CHARS = 200_000;

const PHOTO_URL = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;

/** True for what the app itself stores: a JPEG data URL of sane size. Everything else (also from backups) is dropped. */
export function isPhotoDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= PHOTO_MAX_CHARS && PHOTO_URL.test(value);
}

/** Centre square of a width × height picture (the part that is kept). */
export function centerSquare(width: number, height: number): { sx: number; sy: number; side: number } {
  const side = Math.min(width, height);
  return { sx: Math.round((width - side) / 2), sy: Math.round((height - side) / 2), side };
}
