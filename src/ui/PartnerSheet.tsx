import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { getPartnerPassword, setLastExportAt, setPartnerPassword } from '../data/appState';
import { BackupError, MAX_FILE_BYTES, mergeBackup, parseBackup } from '../data/backup';
import { decryptBackup, DecryptError, PASSWORD_MIN, readEnvelope, type EncryptedEnvelope } from '../data/backupCrypto';
import { t } from '../strings';
import { preparePartnerFile, sharePartnerFile } from './exportFile';
import { Sheet } from './Sheet';

type View = 'loading' | 'setup' | 'ready' | 'otherPassword';

/**
 * "Mit Partner abgleichen" (0.19.0, owner's choice "Option A"): no server. Each phone sends its state as a file
 * encrypted with a shared password, the other phone merges it (deletion notes included).
 * The file is prepared when the sheet opens, because iOS only allows sharing directly in the tap.
 */
export function PartnerSheet(props: { open: boolean; onClose: () => void; onMessage: (text: string) => void }) {
  const p = t.partner;
  const [view, setView] = useState<View>('loading');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File>();
  const [envelope, setEnvelope] = useState<EncryptedEnvelope>();
  const fileInput = useRef<HTMLInputElement>(null);

  const prepare = async (shared: string) => {
    setFile(undefined);
    setFile(await preparePartnerFile(shared));
  };

  useLayoutEffect(() => {
    if (!props.open) return;
    setView('loading');
    setPassword('');
    setRepeat('');
    setError(undefined);
    setBusy(false);
    setFile(undefined);
    setEnvelope(undefined);
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;
    let current = true;
    void getPartnerPassword().then((shared) => {
      if (!current) return;
      setView(shared ? 'ready' : 'setup');
      if (shared) void prepare(shared);
    });
    return () => {
      current = false;
    };
  }, [props.open]);

  const savePassword = async (event: Event) => {
    event.preventDefault();
    const problem = password.length < PASSWORD_MIN ? t.encryptedExport.tooShort(PASSWORD_MIN) : password !== repeat ? t.encryptedExport.mismatch : undefined;
    setError(problem);
    if (problem) return;
    await setPartnerPassword(password);
    setPassword('');
    setRepeat('');
    setView('ready');
    void prepare(password);
  };

  const send = () => {
    if (!file) return;
    void sharePartnerFile(file).then(async (sent) => {
      if (!sent) return;
      // The file is a full backup, too.
      await setLastExportAt();
      props.onMessage(p.sent);
    });
  };

  const merge = async (text: string, shared: string | undefined) => {
    const result = await mergeBackup(parseBackup(text));
    if (shared) await setPartnerPassword(shared);
    props.onClose();
    props.onMessage(p.done(result.changed, result.removed));
  };

  const onFileChosen = async (input: HTMLInputElement) => {
    const chosen = input.files?.[0];
    input.value = ''; // the same file can be chosen again
    if (!chosen || busy) return;
    setError(undefined);
    if (chosen.size > MAX_FILE_BYTES) {
      setError(t.restore.errors.tooBig);
      return;
    }
    setBusy(true);
    try {
      const text = await chosen.text();
      const found = readEnvelope(text);
      if (!found) {
        await merge(text, undefined); // a normal backup works too
        return;
      }
      const shared = await getPartnerPassword();
      try {
        await merge(await decryptBackup(found, shared ?? ''), undefined);
      } catch (e) {
        if (!(e instanceof DecryptError)) throw e;
        setEnvelope(found);
        setView('otherPassword');
      }
    } catch (e) {
      if (e instanceof BackupError) setError(e.message);
      else setError(t.restore.errors.notJson);
    } finally {
      setBusy(false);
    }
  };

  const unlock = async (event: Event) => {
    event.preventDefault();
    if (!envelope || busy) return;
    setBusy(true);
    try {
      await merge(await decryptBackup(envelope, password), password);
    } catch (e) {
      if (e instanceof DecryptError) setError(t.restore.wrongPassword);
      else if (e instanceof BackupError) setError(e.message);
      else throw e;
    } finally {
      setBusy(false);
    }
  };

  const errorText = error && (
    <p id="partner-error" class="field-error" role="alert">
      {error}
    </p>
  );

  return (
    <Sheet open={props.open} onClose={props.onClose} labelledBy="partner-title">
      <h2 id="partner-title" class="sheet-title">
        {p.title}
      </h2>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        class="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void onFileChosen(e.currentTarget)}
      />

      {view === 'setup' && (
        <form class="editor" noValidate onSubmit={(ev) => void savePassword(ev)}>
          <p class="sheet-text">{p.intro}</p>
          <p class="sheet-text">{p.setupText}</p>
          <div class="field">
            <label class="field-label" for="partner-password">
              {p.password}
            </label>
            <input
              id="partner-password"
              class="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onInput={(ev) => setPassword(ev.currentTarget.value)}
              aria-invalid={error ? true : undefined}
            />
          </div>
          <div class="field">
            <label class="field-label" for="partner-password-repeat">
              {p.repeat}
            </label>
            <input
              id="partner-password-repeat"
              class="input"
              type="password"
              autoComplete="new-password"
              value={repeat}
              onInput={(ev) => setRepeat(ev.currentTarget.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'partner-error' : undefined}
            />
            {errorText}
          </div>
          <div class="sheet-actions sheet-actions--row">
            <button type="button" class="big-btn big-btn--white" onClick={props.onClose}>
              {p.cancel}
            </button>
            <button type="submit" class="big-btn big-btn--rose">
              {p.savePassword}
            </button>
          </div>
        </form>
      )}

      {view === 'ready' && (
        <>
          <ol class="sheet-text guide-steps">
            {p.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {errorText}
          <div class="sheet-actions">
            <button type="button" class="big-btn big-btn--rose" disabled={!file} onClick={send}>
              {file ? p.send : p.preparing}
            </button>
            <button type="button" class="big-btn big-btn--white" disabled={busy} onClick={() => fileInput.current?.click()}>
              {busy ? p.receiving : p.receive}
            </button>
            <button type="button" class="text-btn" onClick={() => setView('setup')}>
              {p.changePassword}
            </button>
          </div>
        </>
      )}

      {view === 'otherPassword' && (
        <form class="editor" noValidate onSubmit={(ev) => void unlock(ev)}>
          <p class="sheet-text">{p.otherPassword}</p>
          <div class="field">
            <label class="field-label" for="partner-other-password">
              {p.password}
            </label>
            <input
              id="partner-other-password"
              class="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onInput={(ev) => setPassword(ev.currentTarget.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'partner-error' : undefined}
            />
            {errorText}
          </div>
          <div class="sheet-actions sheet-actions--row">
            <button type="button" class="big-btn big-btn--white" onClick={props.onClose}>
              {p.cancel}
            </button>
            <button type="submit" class="big-btn big-btn--rose" disabled={!password || busy}>
              {busy ? p.receiving : p.unlock}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
