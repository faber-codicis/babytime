import { useLayoutEffect, useState } from 'preact/hooks';
import { BackupError, importBackup, type ImportMode, type ParsedBackup } from '../data/backup';
import { t } from '../strings.de';
import { Sheet } from './Sheet';

export type RestoreState = { backup: ParsedBackup } | { error: string };

const dateFormat = new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Preview "123 Einträge", choice Ersetzen / Zusammenführen, confirmation (spec 6.8). */
export function RestoreSheet(props: { state: RestoreState | undefined; onClose: () => void; onDone: (count: number) => void }) {
  const [mode, setMode] = useState<ImportMode>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    setMode(undefined);
    setError(undefined);
  }, [props.state]);

  const state = props.state;
  const shownError = error ?? (state && 'error' in state ? state.error : undefined);
  const backup = state && 'backup' in state ? state.backup : undefined;

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
