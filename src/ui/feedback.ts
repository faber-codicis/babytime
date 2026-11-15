import { t } from '../strings';

/** Where testers send feedback (0.13.0). The same address the project page uses for test requests. */
export const FEEDBACK_EMAIL = 'kontakt@mraz.app';

/**
 * "Feedback senden" (0.13.0): a mailto link with a prefilled draft. Nothing is sent by the app – the mail app
 * opens and the tester decides. The draft holds only version and device details, never any entries.
 */
export function feedbackMailto(version: string, builtAt: string, userAgent: string, installed: boolean): string {
  const subject = t.feedback.subject(version);
  const body = t.feedback.body(version, builtAt, userAgent, installed);
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
