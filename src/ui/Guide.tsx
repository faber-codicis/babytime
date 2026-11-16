import type { Guide, GuideTarget } from '../changelog';
import { navigate } from '../router';
import { lang, t } from '../strings';

/** The settings row each guide leads to (element id in Settings). */
export const GUIDE_ANCHOR: Record<GuideTarget, string> = {
  language: 'settings-language',
  feedback: 'settings-feedback',
  tutorial: 'settings-tutorial',
};

let pending: GuideTarget | undefined;

/** The guide button: go to the settings; the Settings view then shows and focuses the row. */
export function openGuideTarget(target: GuideTarget): void {
  pending = target;
  navigate('settings');
}

/** Called once by Settings after it is shown: scrolls to the row the guide pointed at and marks it briefly. */
export function showPendingGuideTarget(): void {
  const target = pending;
  pending = undefined;
  if (!target) return;
  const row = document.getElementById(GUIDE_ANCHOR[target]);
  if (!row) return;
  const show = () => {
    row.scrollIntoView({ block: 'center' });
    row.focus({ preventScroll: true });
    row.classList.add('is-guided');
    window.setTimeout(() => row.classList.remove('is-guided'), 2500);
  };
  // Coming from the update popup: it is still closing and hands focus back when it is done – focus after that.
  const closing = document.querySelector('dialog[open]');
  if (closing) closing.addEventListener('close', () => window.setTimeout(show, 0), { once: true });
  else show();
}

/**
 * "So geht's" card for a new feature (owner's rule since 0.14.0): numbered steps and a button straight to it.
 * Used in the update popup and under its version in "Was ist neu", so it can be opened again later.
 */
export function GuideCard({ guide, onGo }: { guide: Guide; onGo: () => void }) {
  const text = guide.text[lang];
  return (
    <div class="guide-card">
      <p class="guide-title">{t.guide.title}</p>
      <ol class="guide-steps" aria-label={t.guide.stepsA11y}>
        {text.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button type="button" class="pill-btn pill-btn--rose guide-btn" onClick={onGo}>
        {text.button}
      </button>
    </div>
  );
}
