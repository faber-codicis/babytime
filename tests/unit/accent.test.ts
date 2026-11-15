import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCENT_KEY, ACCENTS, getAccent, resetTheme, saveAccent, THEME_KEY } from '../../src/data/theme';
import { BAR_COLOR } from '../../src/ui/theme';

describe('accent colour storage', () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is rosé by default and for unknown values', () => {
    expect(getAccent()).toBe('rose');
    store.set(ACCENT_KEY, 'pink');
    expect(getAccent()).toBe('rose');
  });

  it('remembers a choice; rosé removes the key', () => {
    saveAccent('green');
    expect(store.get(ACCENT_KEY)).toBe('green');
    expect(getAccent()).toBe('green');
    saveAccent('rose');
    expect(store.has(ACCENT_KEY)).toBe(false);
  });

  it('"Alle Daten löschen" resets design and accent', () => {
    saveAccent('blue');
    store.set(THEME_KEY, 'dark');
    resetTheme();
    expect(store.size).toBe(0);
  });

  it('stays rosé when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
    });
    expect(getAccent()).toBe('rose');
  });
});

// ---------------------------------------------------------------- contrast (WCAG 2.x), read from the real CSS

// Line endings normalised: on Windows with core.autocrlf the checkout has CRLF.
const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const css = read('src/styles/tokens.css');
const swatchCss = read('src/styles/settings.css');
const initJs = read('public/theme-init.js');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`missing ${selector}`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('accent colours have enough contrast', () => {
  const light = block(':root');
  const dark = block(":root[data-theme='dark']");

  for (const accent of ACCENTS) {
    const l = accent === 'rose' ? light : { ...light, ...block(`:root[data-accent='${accent}']`) };
    const d = accent === 'rose' ? dark : { ...dark, ...block(`:root[data-theme='dark'][data-accent='${accent}']`) };

    it(`${accent}, light: white on the accent, ink on tint and background`, () => {
      expect(ratio(l['--on-rose']!, l['--rose']!)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(l['--rose']!, l['--bg']!)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(l['--rose-ink']!, l['--rose-tint']!)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(l['--rose-ink']!, l['--bg']!)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${accent}, dark: dark text on the accent >= 6:1 (house rule), accent and ink on surfaces`, () => {
      expect(ratio(d['--on-rose']!, d['--rose']!)).toBeGreaterThanOrEqual(6);
      expect(ratio(d['--rose']!, d['--surface']!)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(d['--rose-ink']!, d['--rose-tint']!)).toBeGreaterThanOrEqual(6);
      expect(ratio(d['--rose-ink']!, d['--surface-2']!)).toBeGreaterThanOrEqual(6);
    });

    it(`${accent}: swatch, browser bar and first-paint script use the same colour`, () => {
      expect(BAR_COLOR[accent].toLowerCase()).toBe(l['--rose']);
      expect(swatchCss).toContain(`.accent-swatch[data-color='${accent}'] {\n  --swatch: ${l['--rose']};`);
      expect(swatchCss).toContain(`:root[data-theme='dark'] .accent-swatch[data-color='${accent}'] {\n  --swatch: ${d['--rose']};`);
      if (accent !== 'rose') expect(initJs.toLowerCase()).toContain(`${accent}: '${l['--rose']}'`);
    });
  }
});

// 0.12.0, after an outside UX review: secondary text ("rechts · 22 Minuten · um 12:06", "Nächste Seite") and the
// outlined "other side" ring must stay readable on every card, in both designs and with every accent.
describe('secondary text and the L/R ring are readable on every card', () => {
  const light = block(':root');
  const dark = block(":root[data-theme='dark']");
  const cards = ['--bg', '--surface', '--surface-2', '--rose-tint', '--peach', '--lavender', '--sky'];

  for (const accent of ACCENTS) {
    const l = accent === 'rose' ? light : { ...light, ...block(`:root[data-accent='${accent}']`) };
    const d = accent === 'rose' ? dark : { ...dark, ...block(`:root[data-theme='dark'][data-accent='${accent}']`) };
    for (const [name, tokens] of [['light', l], ['dark', d]] as const) {
      it(`${accent}, ${name}: --ink-soft >= 4.5:1 (WCAG AA text, also enough for the ring)`, () => {
        for (const card of cards) expect(ratio(tokens['--ink-soft']!, tokens[card]!), card).toBeGreaterThanOrEqual(4.5);
      });
      it(`${accent}, ${name}: the filled "next side" stands out from its card >= 3:1 (WCAG 1.4.11)`, () => {
        expect(ratio(tokens['--rose']!, tokens['--rose-tint']!)).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
