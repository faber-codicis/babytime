import { buildExport, exportFileName } from '../data/backup';
import { t } from '../strings.de';

/** Builds the backup file in advance, so the tap can share it synchronously (iOS needs the user gesture). */
export async function prepareExportFile(): Promise<File> {
  const backup = await buildExport();
  return new File([JSON.stringify(backup)], exportFileName(backup.exportedAt), { type: 'application/json' });
}

/** `navigator.standalone` exists only in iOS/iPadOS WebKit (tab or home screen). */
const isIos = () => 'standalone' in navigator;

/**
 * Spec 6.8: Web Share with the file on iOS (→ "In Dateien sichern"), otherwise a normal download.
 * Resolves to false if the user cancelled the share sheet.
 */
export async function deliverExportFile(file: File): Promise<boolean> {
  if (isIos() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: t.data.exportShareTitle });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false;
      // Sharing not possible after all: fall back to the download below.
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
