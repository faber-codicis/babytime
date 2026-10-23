import type { ChangelogEntry } from './changelog';

type Semver = [number, number, number];

/** "0.10.0" → [0, 10, 0]; undefined if not plain MAJOR.MINOR.PATCH. */
export function parseSemver(version: string): Semver | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

/** Numeric SemVer comparison (so 0.10.0 > 0.9.0, unlike a string comparison). */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    const diff = pa[i]! - pb[i]!;
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

export type UpdateDecision =
  /** Nothing to show. */
  | { kind: 'none' }
  /** First install or device from before this feature: store the current version silently. */
  | { kind: 'remember' }
  /** Show the popup with these versions (newest first). */
  | { kind: 'popup'; entries: ChangelogEntry[] };

/** Spec 6.9: compare lastSeenVersion with the running version. */
export function decideUpdate(lastSeen: string | undefined, current: string, changelog: readonly ChangelogEntry[]): UpdateDecision {
  if (lastSeen === undefined || !parseSemver(lastSeen)) return { kind: 'remember' };
  if (compareSemver(lastSeen, current) >= 0) return { kind: 'none' };
  const entries = changelog
    .filter((e) => compareSemver(e.version, lastSeen) > 0 && compareSemver(e.version, current) <= 0)
    .sort((a, b) => compareSemver(b.version, a.version));
  // Newer version without changelog entry (should not happen, a test guards it): just remember it.
  return entries.length > 0 ? { kind: 'popup', entries } : { kind: 'remember' };
}
