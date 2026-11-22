import { OWNER, PRIVACY_UPDATED } from '../legal';
import { formatIsoDate } from '../logic/time';
import { t } from '../strings';
import { FEEDBACK_EMAIL } from './feedback';
import { Sheet } from './Sheet';

/**
 * Privacy policy (Art. 13 GDPR) and, once the owner has filled in the town, the disclosure under
 * § 25 Abs. 5 MedienG (0.16.1). Shown in the app, so it is reachable offline like everything else.
 */
export function PrivacySheet(props: { open: boolean; onClose: () => void }) {
  const p = t.privacy;
  return (
    <Sheet open={props.open} onClose={props.onClose} labelledBy="privacy-title">
      <div class="legal">
        <h2 id="privacy-title" class="sheet-title">
          {p.title}
        </h2>
        <p class="legal-updated">{p.updated(formatIsoDate(PRIVACY_UPDATED))}</p>
        <p class="legal-summary">{p.summary}</p>
        <h3>{p.controllerTitle}</h3>
        <p>{p.controller(OWNER.name, FEEDBACK_EMAIL)}</p>
        {p.sections.map((section) => (
          <section key={section.title}>
            <h3>{section.title}</h3>
            <p>{section.text}</p>
          </section>
        ))}
        {OWNER.place && (
          <section>
            <h3>{p.imprintTitle}</h3>
            <p>{p.imprint(OWNER.name, OWNER.place)}</p>
          </section>
        )}
      </div>
      <div class="sheet-actions">
        <button type="button" class="big-btn big-btn--rose" data-autofocus onClick={props.onClose}>
          {p.close}
        </button>
      </div>
    </Sheet>
  );
}
