import { getLanguageChoice, pickLang, type Lang } from './data/language';
import { de } from './strings.de';
import { en } from './strings.en';

/**
 * The shape every language must have: the German texts with literal types widened (string stays string,
 * functions keep their parameters, tuples keep their length). `strings.en.ts` is typed with it, so a
 * missing or extra key fails the type check.
 */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends object
      ? { readonly [K in keyof T]: Widen<T[K]> }
      : T;

export type Strings = Widen<typeof de>;

/**
 * The language is fixed for the whole run: switching it in the settings stores the choice and restarts the app.
 * Outside a browser (unit tests) it is German.
 */
export const lang: Lang =
  typeof document === 'undefined' ? 'de' : pickLang(getLanguageChoice(), navigator.languages?.length ? navigator.languages : [navigator.language]);

if (typeof document !== 'undefined') document.documentElement.lang = lang;

export const t: Strings = lang === 'en' ? en : de;
