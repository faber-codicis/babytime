import { centerSquare, isPhotoDataUrl, PHOTO_SIZE } from '../data/photo';

/** Larger files are refused before decoding (phones take 3–12 MB pictures). */
export const PHOTO_FILE_MAX_BYTES = 30 * 1024 * 1024;

export class PhotoError extends Error {}

type Picture = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: File): Promise<Picture> {
  // Honours the EXIF rotation, so the photo is upright although the metadata itself is not kept.
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Fall through to <img>, which some Safari versions decode where createImageBitmap does not.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => undefined };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Turns a picked picture into the stored photo: centre square, PHOTO_SIZE pixels, JPEG. Drawing on a canvas
 * and encoding again keeps only the pixels, so GPS position, camera and time from the original are gone.
 * Runs fully offline; nothing is sent anywhere.
 */
export async function photoFromFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/') || file.size > PHOTO_FILE_MAX_BYTES) throw new PhotoError('unreadable');
  let picture: Picture;
  try {
    picture = await decode(file);
  } catch {
    throw new PhotoError('unreadable');
  }
  try {
    if (!picture.width || !picture.height) throw new PhotoError('unreadable');
    const { sx, sy, side } = centerSquare(picture.width, picture.height);
    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_SIZE;
    canvas.height = PHOTO_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new PhotoError('unreadable');
    ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background instead of black
    ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(picture.source, sx, sy, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
    const url = canvas.toDataURL('image/jpeg', 0.85);
    if (!isPhotoDataUrl(url)) throw new PhotoError('unreadable');
    return url;
  } finally {
    picture.close();
  }
}
