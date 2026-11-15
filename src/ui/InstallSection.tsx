import { t } from '../strings';
import { isIosBrowserTab } from './InstallHint';
import { useInstallPrompt } from './installPrompt';

/** True when the app runs from the home screen (installed). */
export function isInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
}

/** "Als App installieren" in the settings, only while not installed (iOS steps, Android button or menu hint). */
export function InstallSection() {
  const install = useInstallPrompt();
  if (isInstalled()) return null;

  return (
    <div class="settings-card install-section">
      <p class="settings-card-title">{t.settings.install}</p>
      <p class="settings-card-text">{t.installHint.intro}</p>
      {isIosBrowserTab() ? (
        <ol class="install-hint-steps">
          {t.installHint.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : install ? (
        <button type="button" class="big-btn big-btn--rose install-hint-btn" onClick={() => void install()}>
          {t.installHint.install}
        </button>
      ) : (
        <p class="settings-card-text">{t.settings.installAndroidMenu}</p>
      )}
    </div>
  );
}
