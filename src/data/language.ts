/**
 * App language (0.14.0): German or English. "auto" (default, nothing stored) follows the phone:
 * German for any de-* language, English for everything else.
 * Stored in localStorage like the design, because public/theme-init.js sets <html lang> and the splash text
 * before the first paint. Key, values and the detection rule are repeated there – keep both in sync.
 * Not part of the backup and not reset by "Alle Daten löschen": it is a device setting, not personal data.
 */
export const LANGUAGE_KEY = 'babytime-lang';

export const LANGUAGES = ['de', 'en'] as const;
export type Lang = (typeof LANGUAGES)[number];
export type LanguageChoice = Lang | 'auto';

/** German for de, de-AT, de-CH …, otherwise English. Only the phone's first (preferred) language counts. */
export function pickLang(choice: LanguageChoice, phoneLanguages: readonly string[]): Lang {
  if (choice !== 'auto') return choice;
  return /^de(-|$)/i.test(phoneLanguages[0] ?? '') ? 'de' : 'en';
}

export function getLanguageChoice(): LanguageChoice {
  try {
    const value = localStorage.getItem(LANGUAGE_KEY);
    return value === 'de' || value === 'en' ? value : 'auto';
  } catch {
    return 'auto'; // storage blocked: follow the phone
  }
}

export function saveLanguageChoice(choice: LanguageChoice): void {
  try {
    if (choice === 'auto') localStorage.removeItem(LANGUAGE_KEY);
    else localStorage.setItem(LANGUAGE_KEY, choice);
  } catch {
    // Not persisted; nothing else to do.
  }
}
