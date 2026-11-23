/**
 * Who runs Baby Time, for the privacy policy and the disclosure (Offenlegung, § 25 Abs. 5 MedienG), 0.16.1.
 * `place` is the town of residence only, never the street address. While it is empty, the disclosure
 * block stays hidden; the owner fills it in.
 */
export const OWNER = {
  name: 'Christoph Mraz',
  place: 'Wien',
} as const;

/** Date of the current privacy policy text (YYYY-MM-DD). Change it with every change to the text. */
export const PRIVACY_UPDATED = '2026-11-23';
