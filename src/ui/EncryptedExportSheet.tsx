import { useLayoutEffect, useState } from 'preact/hooks';
import { PASSWORD_MIN } from '../data/backupCrypto';
import { t } from '../strings';
import { prepareEncryptedExportFile } from './exportFile';
import { Sheet } from './Sheet';

/**
 * "Mit Passwort exportieren": password twice, then the file is encrypted, then a second tap delivers it
 * (iOS only allows sharing directly inside a tap, and encrypting takes a moment).
 */
export function EncryptedExportSheet(props: { open: boolean; onClose: () => void; onDeliver: (file: File) => void }) {
  const e = t.encryptedExport;
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File>();

  useLayoutEffect(() => {
    if (!props.open) return;
    setPassword('');
    setRepeat('');
    setError(undefined);
    setBusy(false);
    setFile(undefined);
  }, [props.open]);

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    if (busy) return;
    const problem = password.length < PASSWORD_MIN ? e.tooShort(PASSWORD_MIN) : password !== repeat ? e.mismatch : undefined;
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      setFile(await prepareEncryptedExportFile(password));
      setPassword('');
      setRepeat('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={props.open} onClose={props.onClose} labelledBy="encrypted-export-title">
      <form class="editor" noValidate onSubmit={(ev) => void onSubmit(ev)}>
        <h2 id="encrypted-export-title" class="sheet-title">
          {e.title}
        </h2>
        {file ? (
          <>
            <p class="sheet-text" role="status">
              {e.ready}
            </p>
            <div class="sheet-actions">
              <button type="button" class="big-btn big-btn--rose" onClick={() => props.onDeliver(file)}>
                {e.save}
              </button>
              <button type="button" class="big-btn big-btn--white" onClick={props.onClose}>
                {e.cancel}
              </button>
            </div>
          </>
        ) : (
          <>
            <p class="sheet-text">{e.text}</p>
            <div class="field">
              <label class="field-label" for="export-password">
                {e.password}
              </label>
              <input
                id="export-password"
                class="input"
                type="password"
                autoComplete="new-password"
                value={password}
                onInput={(ev) => setPassword(ev.currentTarget.value)}
                aria-invalid={error ? true : undefined}
              />
            </div>
            <div class="field">
              <label class="field-label" for="export-password-repeat">
                {e.repeat}
              </label>
              <input
                id="export-password-repeat"
                class="input"
                type="password"
                autoComplete="new-password"
                value={repeat}
                onInput={(ev) => setRepeat(ev.currentTarget.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'export-password-error' : undefined}
              />
              {error && (
                <p id="export-password-error" class="field-error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <div class="sheet-actions sheet-actions--row">
              <button type="button" class="big-btn big-btn--white" onClick={props.onClose}>
                {e.cancel}
              </button>
              <button type="submit" class="big-btn big-btn--rose" disabled={busy}>
                {busy ? e.creating : e.create}
              </button>
            </div>
          </>
        )}
      </form>
    </Sheet>
  );
}
