import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { changelog, type ChangelogEntry } from '../../src/changelog';
import { compareSemver, decideUpdate } from '../../src/version';

const log: ChangelogEntry[] = [
  { version: '0.10.0', date: '2026-12-01', items: ['zehn'] },
  { version: '0.9.0', date: '2026-11-15', items: ['neun'] },
  { version: '0.3.0', date: '2026-11-01', items: ['drei a', 'drei b'] },
  { version: '0.2.0', date: '2026-10-21', items: ['zwei'] },
];

describe('compareSemver', () => {
  it('compares numerically: 0.10.0 > 0.9.0', () => {
    expect(compareSemver('0.10.0', '0.9.0')).toBe(1);
    expect(compareSemver('0.9.0', '0.10.0')).toBe(-1);
    expect(compareSemver('1.0.0', '0.99.99')).toBe(1);
    expect(compareSemver('0.2.0', '0.2.0')).toBe(0);
  });
});

describe('decideUpdate (spec 6.9)', () => {
  it('missing value: no popup, remember silently', () => {
    expect(decideUpdate(undefined, '0.3.0', log)).toEqual({ kind: 'remember' });
  });

  it('same version: no popup', () => {
    expect(decideUpdate('0.3.0', '0.3.0', log)).toEqual({ kind: 'none' });
  });

  it('smaller version: popup with that version', () => {
    expect(decideUpdate('0.2.0', '0.3.0', log)).toEqual({ kind: 'popup', entries: [log[2]] });
  });

  it('two skipped versions: both listed, newest first', () => {
    const decision = decideUpdate('0.3.0', '0.10.0', log);
    expect(decision).toEqual({ kind: 'popup', entries: [log[0], log[1]] });
  });

  it('0.10.0 counts as newer than 0.9.0 (no string comparison)', () => {
    expect(decideUpdate('0.9.0', '0.10.0', log)).toEqual({ kind: 'popup', entries: [log[0]] });
  });

  it('a newer stored version (downgrade) shows nothing', () => {
    expect(decideUpdate('0.10.0', '0.3.0', log)).toEqual({ kind: 'none' });
  });
});

describe('changelog', () => {
  it('has an entry for the version in package.json', () => {
    const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };
    expect(changelog.map((e) => e.version)).toContain(version);
  });

  it('is sorted newest first, with 3 to 5 items and ISO dates', () => {
    for (let i = 1; i < changelog.length; i++) expect(compareSemver(changelog[i - 1]!.version, changelog[i]!.version)).toBe(1);
    for (const entry of changelog) {
      expect(entry.items.length).toBeGreaterThanOrEqual(3);
      expect(entry.items.length).toBeLessThanOrEqual(5);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
