import { buildExport, exportFileName } from '../data/backup';
import { encryptBackup } from '../data/backupCrypto';
import { t } from '../strings';

/** Builds the backup file in advance, so the tap can share it synchronously (iOS needs the user gesture). */
export async function prepareExportFile(): Promise<File> {
  const backup = await buildExport();
  return new File([JSON.stringify(backup)], exportFileName(backup.exportedAt), { type: 'application/json' });
}

/** Password-protected backup ("babytime-2026-10-21-verschluesselt.json"). Built after the password is entered. */
export async function prepareEncryptedExportFile(password: string): Promise<File> {
  const backup = await buildExport();
  const envelope = await encryptBackup(JSON.stringify(backup), password);
  const name = exportFileName(backup.exportedAt).replace(/\.json$/, '-verschluesselt.json');
  return new File([JSON.stringify(envelope)], name, { type: 'application/json' });
}

/** File for "Mit Partner abgleichen" (0.19.0): always encrypted with the shared password ("babytime-abgleich-2026-11-23.json"). */
export async function preparePartnerFile(password: string): Promise<File> {
  const backup = await buildExport();
  const envelope = await encryptBackup(JSON.stringify(backup), password);
  const name = exportFileName(backup.exportedAt).replace(/^babytime-/, 'babytime-abgleich-');
  return new File([JSON.stringify(envelope)], name, { type: 'application/json' });
}

/**
 * Partner file: the share sheet wherever files can be shared (Android and iOS, straight to a messenger),
 * otherwise a download. Resolves to false if the user cancelled the share sheet.
 */
export async function sharePartnerFile(file: File): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: t.partner.shareTitle });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false;
    }
  }
  download(file);
  return true;
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
  download(file);
  return true;
}

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
