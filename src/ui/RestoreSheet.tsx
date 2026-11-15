import { useLayoutEffect, useState } from 'preact/hooks';
import { BackupError, importBackup, parseBackup, type ImportMode, type ParsedBackup } from '../data/backup';
import { decryptBackup, DecryptError, type EncryptedEnvelope } from '../data/backupCrypto';
import { t } from '../strings';
import { Sheet } from './Sheet';

export type RestoreState = { backup: ParsedBackup } | { encrypted: EncryptedEnvelope } | { error: string };

const dateFormat = new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Preview "123 Einträge", choice Ersetzen / Zusammenführen, confirmation (spec 6.8). */
export function RestoreSheet(props: { state: RestoreState | undefined; onClose: () => void; onDone: (count: number) => void }) {
  const [mode, setMode] = useState<ImportMode>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();
  const [unlocked, setUnlocked] = useState<ParsedBackup>();

  useLayoutEffect(() => {
    setMode(undefined);
    setError(undefined);
    setPassword('');
    setPasswordError(undefined);
    setUnlocked(undefined);
  }, [props.state]);

  const state = props.state;
  const shownError = error ?? (state && 'error' in state ? state.error : undefined);
  const envelope = state && 'encrypted' in state ? state.encrypted : undefined;
  const backup = unlocked ?? (state && 'backup' in state ? state.backup : undefined);

  const unlock = async (event: Event) => {
    event.preventDefault();
    if (!envelope || busy) return;
    setBusy(true);
    try {
      const text = await decryptBackup(envelope, password);
      setPassword('');
      setUnlocked(parseBackup(text));
    } catch (e) {
      if (e instanceof DecryptError) setPasswordError(t.restore.wrongPassword);
      else if (e instanceof BackupError) setError(e.message);
      else throw e;
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!backup || !mode || busy) return;
    setBusy(true);
    try {
      props.onDone(await importBackup(backup, mode));
    } catch (e) {
      if (e instanceof BackupError) setError(e.message);
      else throw e;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={Boolean(state)} onClose={props.onClose} labelledBy="restore-title">
      <h2 id="restore-title" class="sheet-title">
        {t.restore.title}
      </h2>

      {shownError ? (
        <>
          <p class="sheet-text restore-error" role="alert">
            {shownError}
          </p>
          <div class="sheet-actions">
            <button type="button" class="big-btn big-btn--white" onClick={props.onClose}>
              {t.restore.cancel}
            </button>
          </div>
        </>
      ) : envelope && !backup ? (
        <form class="editor" noValidate onSubmit={(ev) => void unlock(ev)}>
          <p class="sheet-text">{t.restore.encryptedText}</p>
          <div class="field">
            <label class="field-label" for="restore-password">
              {t.restore.password}
            </label>
            <input
              id="restore-password"
              class="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onInput={(ev) => setPassword(ev.currentTarget.value)}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? 'restore-password-error' : undefined}
            />
            {passwordError && (
              <p id="restore-password-error" class="field-error" role="alert">
                {passwordError}
              </p>
            )}
          </div>
          <div class="sheet-actions sheet-actions--row">
            <button type="button" class="big-btn big-btn--white" onClick={props.onClose}>
              {t.restore.cancel}
            </button>
            <button type="submit" class="big-btn big-btn--rose" disabled={!password || busy}>
              {busy ? t.restore.unlocking : t.restore.unlock}
            </button>
          </div>
        </form>
      ) : (
        backup && (
          <>
            <p class="sheet-text">
              {t.restore.found(t.restore.count(backup.events.length))}{' '}
              {backup.exportedAt !== undefined && t.restore.exportedAt(dateFormat.format(backup.exportedAt))}
            </p>
            <div class="restore-modes" role="group" aria-label={t.restore.title}>
              {(['replace', 'merge'] as const).map((m) => (
                <button key={m} type="button" class={`restore-mode${mode === m ? ' is-active' : ''}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
                  <span class="restore-mode-label">{m === 'replace' ? t.restore.replace : t.restore.merge}</span>
                  <span class="restore-mode-hint">{m === 'replace' ? t.restore.replaceHint : t.restore.mergeHint}</span>
                </button>
              ))}
            </div>
            <div class="sheet-actions sheet-actions--row">
              <button type="button" class="big-btn big-btn--white" onClick={props.onClose}>
                {t.restore.cancel}
              </button>
              <button type="button" class="big-btn big-btn--rose" disabled={!mode || busy} onClick={() => void confirm()}>
                {mode === 'merge' ? t.restore.confirmMerge : t.restore.confirmReplace}
              </button>
            </div>
          </>
        )
      )}
    </Sheet>
  );
}
