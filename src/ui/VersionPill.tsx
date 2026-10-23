import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { formatStamp } from '../logic/time';
import { hashOf } from '../router';
import { t } from '../strings.de';
import { checkForUpdate, restartApp, useAppUpdate, type UpdateStatus } from './appUpdate';
import { Icon } from './icons';

const STATUS_TEXT: Partial<Record<UpdateStatus, string>> = {
  checking: t.update.checking,
  loading: t.update.loading,
  latest: t.update.latest,
  offline: t.update.offline,
  ready: t.update.readyText,
};

/** Version, build time, update status and actions – in the pill's popover and in "Über die App". */
export function VersionDetails({ headingId }: { headingId?: string }) {
  const status = useAppUpdate();
  const busy = status === 'checking' || status === 'loading';
  return (
    <div class="version-details">
      <p class="version-details-title" id={headingId}>
        {t.update.about(__APP_VERSION__)}
      </p>
      <p class="version-details-meta">{t.update.built(formatStamp(__BUILD_TIME__))}</p>
      <p class="version-details-status" role="status">
        {STATUS_TEXT[status] ?? ''}
      </p>
      <div class="version-details-actions">
        {status === 'ready' ? (
          <button type="button" class="big-btn big-btn--rose version-btn" onClick={restartApp}>
            <Icon name="refresh" size={18} />
            {t.update.restart}
          </button>
        ) : (
          <button type="button" class="big-btn big-btn--white version-btn" disabled={busy} onClick={() => void checkForUpdate()}>
            {t.update.check}
          </button>
        )}
        <a class="text-link" href={hashOf('whatsnew')}>
          {t.update.whatsNew}
        </a>
      </div>
    </div>
  );
}

/**
 * Version display on Today (mockup variants A + C): a quiet "v0.4.0" pill that opens the details;
 * once a new version is active it turns into "Update bereit" and restarts on tap – never by itself.
 */
export function VersionPill() {
  const status = useAppUpdate();
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) pill.current?.focus();
  };

  // Layout effect: focus and close handlers are in place in the same frame the popover opens.
  useLayoutEffect(() => {
    if (!open) return;
    popover.current?.querySelector<HTMLElement>('button, a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (anchor.current && !anchor.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer, true);
    };
  }, [open]);

  if (status === 'ready') {
    return (
      <div class="version-anchor">
        <button type="button" class="version-pill-btn" aria-label={t.update.readyA11y} onClick={restartApp}>
          <span class="version-pill version-pill--ready">
            <Icon name="refresh" size={14} />
            {t.update.ready}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div class="version-anchor" ref={anchor}>
      <button
        type="button"
        ref={pill}
        class="version-pill-btn"
        aria-label={t.update.pillA11y(__APP_VERSION__)}
        aria-expanded={open}
        aria-controls="version-popover"
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        <span class={`version-pill${open ? ' is-open' : ''}`}>{t.update.pill(__APP_VERSION__)}</span>
      </button>
      {open && (
        <div id="version-popover" ref={popover} class="version-popover" role="dialog" aria-labelledby="version-popover-title">
          <VersionDetails headingId="version-popover-title" />
        </div>
      )}
    </div>
  );
}
