import { useRef, useState } from 'preact/hooks';
import { setLastExportAt } from '../data/appState';
import { BackupError, deleteAllData, MAX_FILE_BYTES, parseBackup } from '../data/backup';
import { readEnvelope } from '../data/backupCrypto';
import type { Profile } from '../data/profile';
import { navigate } from '../router';
import { t } from '../strings.de';
import { EncryptedExportSheet } from './EncryptedExportSheet';
import { deliverExportFile, prepareExportFile } from './exportFile';
import { useLive } from './hooks';
import { ProfileSheet } from './ProfileSheet';
import { RestoreSheet, type RestoreState } from './RestoreSheet';
import { Sheet } from './Sheet';
import { useDarkTheme } from './theme';

/**
 * The export action, or undefined while the file is being prepared. The file is prepared in advance
 * and kept current with the data, because iOS only allows sharing directly in the tap.
 */
export function useExport(onMessage: (text: string) => void): (() => void) | undefined {
  const exportFile = useLive(prepareExportFile, []);
  return exportFile
    ? () => {
        void deliverExportFile(exportFile).then(async (delivered) => {
          if (!delivered) return;
          await setLastExportAt();
          onMessage(t.data.exported);
        });
      }
    : undefined;
}

/**
 * Export, restore, profile and "delete everything" (spec 6.8) for the settings tab.
 * Render `sheets` once in the screen that uses the actions.
 */
export function useDataActions(profile: Profile | undefined, onMessage: (text: string) => void) {
  const exportNow = useExport(onMessage);
  const [restore, setRestore] = useState<RestoreState>();
  const [profileOpen, setProfileOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [encryptedOpen, setEncryptedOpen] = useState(false);
  const [, setDark] = useDarkTheme();
  const fileInput = useRef<HTMLInputElement>(null);

  const onFileChosen = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = ''; // the same file can be chosen again
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setRestore({ error: t.restore.errors.tooBig });
      return;
    }
    try {
      const text = await file.text();
      const envelope = readEnvelope(text);
      setRestore(envelope ? { encrypted: envelope } : { backup: parseBackup(text, file.size) });
    } catch (error) {
      setRestore({ error: error instanceof BackupError ? error.message : t.restore.errors.notJson });
    }
  };

  const deleteAll = async () => {
    await deleteAllData();
    setDark(false); // like a fresh install: light design
    setDeleteOpen(false);
    // The app now shows the first start, like a fresh install.
    navigate('today', { replace: true });
  };

  const sheets = (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        class="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void onFileChosen(e.currentTarget)}
      />

      <EncryptedExportSheet
        open={encryptedOpen}
        onClose={() => setEncryptedOpen(false)}
        onDeliver={(file) => {
          void deliverExportFile(file).then(async (delivered) => {
            if (!delivered) return;
            setEncryptedOpen(false);
            await setLastExportAt();
            onMessage(t.data.exported);
          });
        }}
      />

      <RestoreSheet
        state={restore}
        onClose={() => setRestore(undefined)}
        onDone={(count) => {
          setRestore(undefined);
          onMessage(t.restore.done(t.restore.count(count)));
        }}
      />

      {profile && (
        <ProfileSheet
          open={profileOpen}
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSaved={() => {
            setProfileOpen(false);
            onMessage(t.profile.saved);
          }}
        />
      )}

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} labelledBy="delete-all-title">
        <h2 id="delete-all-title" class="sheet-title">
          {t.deleteAll.title}
        </h2>
        <p class="sheet-text">{t.deleteAll.text}</p>
        <div class="sheet-actions">
          <button type="button" class="big-btn big-btn--white" disabled={!exportNow} onClick={() => exportNow?.()}>
            {t.deleteAll.exportFirst}
          </button>
          <button type="button" class="big-btn big-btn--rose" autoFocus onClick={() => setDeleteOpen(false)}>
            {t.deleteAll.cancel}
          </button>
          <button type="button" class="big-btn big-btn--warn-solid" onClick={() => void deleteAll()}>
            {t.deleteAll.confirm}
          </button>
        </div>
      </Sheet>
    </>
  );

  return {
    exportNow,
    openEncryptedExport: () => setEncryptedOpen(true),
    openRestore: () => fileInput.current?.click(),
    openProfile: () => setProfileOpen(true),
    openDeleteAll: () => setDeleteOpen(true),
    sheets,
  };
}
