import { describe, expect, it } from 'vitest';
import { pickLang } from '../../src/data/language';
import { de } from '../../src/strings.de';
import { en } from '../../src/strings.en';

/** "today.statFeeds: function/1" for every leaf, so shape and arity can be compared. */
function shape(value: unknown, path = ''): string[] {
  if (typeof value === 'function') return [`${path}: function/${value.length}`];
  if (Array.isArray(value)) return [`${path}: array/${value.length}`];
  if (value && typeof value === 'object') return Object.keys(value).sort().flatMap((key) => shape((value as Record<string, unknown>)[key], path ? `${path}.${key}` : key));
  return [`${path}: ${typeof value}`];
}

describe('languages (0.14.0)', () => {
  it('German and English have exactly the same keys, kinds and function arities', () => {
    expect(shape(en)).toEqual(shape(de));
  });

  it('no English text is empty or still German', () => {
    const texts = shape(en).length;
    expect(texts).toBeGreaterThan(300);
    const strings: string[] = [];
    const collect = (value: unknown) => {
      if (typeof value === 'string') strings.push(value);
      else if (value && typeof value === 'object') Object.values(value).forEach(collect);
    };
    collect(en);
    for (const text of strings) {
      expect(text.trim(), 'empty text').not.toBe('');
      expect(text, text).not.toMatch(/[äöüß]|\b(und|oder|nicht|bitte|Eintrag|Windel|Stillen)\b/i);
    }
  });

  it('functions give English with plurals', () => {
    expect(en.time.daysAgo(1)).toBe('1\u00A0day ago');
    expect(en.time.daysAgo(3)).toBe('3\u00A0days ago');
    expect(en.today.statDiapers(1)).toEqual(['1', 'diaper']);
    expect(en.time.since('14:12')).toBe('since 14:12');
    expect(en.time.since('25\u00A0min')).toBe('for 25\u00A0min');
    expect(en.editor.errors.alreadyRunning(en.editor.errors.runningFeed)).toBe('A feed is already running. Please enter an end.');
  });

  it('picks German for any de-* phone, English otherwise, and a saved choice always wins', () => {
    expect(pickLang('auto', ['de-AT', 'en'])).toBe('de');
    expect(pickLang('auto', ['de'])).toBe('de');
    expect(pickLang('auto', ['en-US', 'de-DE'])).toBe('en');
    expect(pickLang('auto', ['fr-FR'])).toBe('en');
    expect(pickLang('auto', ['dex'])).toBe('en');
    expect(pickLang('auto', [])).toBe('en');
    expect(pickLang('de', ['en-US'])).toBe('de');
    expect(pickLang('en', ['de-AT'])).toBe('en');
  });
});
