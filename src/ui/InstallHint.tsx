import { getFlag, setFlag } from '../data/flags';
import { t } from '../strings.de';
import { useLive } from './hooks';
import { Icon } from './icons';
import { useInstallPrompt } from './installPrompt';

/**
 * True in iPhone/iPad Safari when the page runs in a browser tab, not from the home screen.
 * `navigator.standalone` only exists on iOS/iPadOS WebKit.
 */
export function isIosBrowserTab(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === false && !matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
}

/**
 * "Als App installieren" (spec 6.7) until closed once:
 * iOS Safari gets the manual steps, Chrome (Android) an install button while it offers one.
 */
export function InstallHint() {
  const dismissed = useLive(() => getFlag('installHintDismissed'), []);
  const install = useInstallPrompt();
  const ios = isIosBrowserTab();
  if (dismissed !== false || (!ios && !install)) return null;

  return (
    <section class="install-hint" aria-labelledby="install-hint-title">
      <div class="install-hint-head">
        <h2 id="install-hint-title" class="install-hint-title">
          {t.installHint.title}
        </h2>
        <button
          type="button"
          class="install-hint-close"
          aria-label={t.installHint.close}
          onClick={() => void setFlag('installHintDismissed')}
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <p class="install-hint-intro">{t.installHint.intro}</p>
      {ios ? (
        <ol class="install-hint-steps">
          {t.installHint.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : (
        <button type="button" class="big-btn big-btn--rose install-hint-btn" onClick={() => void install?.()}>
          {t.installHint.install}
        </button>
      )}
    </section>
  );
}
