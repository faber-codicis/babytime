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
 * Update notice on Today: hidden while nothing is pending, so the main screen shows only baby
 * information; version, build time and the update check live in Einstellungen → Über die App.
 * Once a new version is active it shows "Update bereit" and restarts on tap – never by itself.
 */
export function VersionPill() {
  const status = useAppUpdate();
  if (status !== 'ready') return null;
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
